import { checkoutRepository } from "@/repositories/checkout-repository";
import { productRepository } from "@/repositories/product-repository";
import { productPriceRepository } from "@/repositories/product-price-repository";
import { purchaseService } from "@/services/purchase-service";
import { userRepository } from "@/repositories/user-repository";
import { getPaymentProvider, getPaymentConfig } from "@/lib/payment";
import { hashPassword } from "@/lib/password";
import crypto from "crypto";
import type { CreateCheckoutInput, CheckoutResult, PaymentMode } from "@/types";
import type { CreateSessionInput } from "@/lib/payment/types";

/**
 * Resolve the active Stripe price ID for a product.
 * First checks ProductPrice records for a date-active price in the current mode.
 * Falls back to the legacy single-price fields on Product.
 */
async function resolveStripePriceId(
  product: {
    id: string;
    name: string;
    stripeTestPriceId: string | null;
    stripeLivePriceId: string | null;
  },
  mode: PaymentMode,
): Promise<{ priceId: string; amount: number | null }> {
  // Try ProductPrice table first
  const activePrice = await productPriceRepository.findActivePrice(
    product.id,
    mode,
  );
  if (activePrice) {
    return { priceId: activePrice.stripePriceId, amount: activePrice.amount };
  }

  // Fallback to legacy single-price fields
  const priceId =
    mode === "test" ? product.stripeTestPriceId : product.stripeLivePriceId;
  if (!priceId) {
    throw new Error(
      `Product "${product.name}" has no Stripe ${mode} price ID configured.`,
    );
  }
  return { priceId, amount: null };
}

export const checkoutService = {
  async createSession(
    input: CreateCheckoutInput,
    userId?: string,
  ): Promise<CheckoutResult> {
    if (!input.items.length) {
      throw new Error("Cart is empty.");
    }

    const config = await getPaymentConfig();
    if (!config.secretKey) {
      throw new Error("Payment is not configured. Contact the administrator.");
    }

    // Load all products
    const products = await Promise.all(
      input.items.map(async (item) => {
        const product = await productRepository.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (!product.isActive)
          throw new Error(`Product "${product.name}" is no longer available.`);
        return { ...product, quantity: item.quantity };
      }),
    );

    // Determine Stripe checkout mode
    // If any product is recurring, use subscription mode (one-time items become invoice items)
    const hasRecurring = products.some((p) => p.paymentModel === "recurring");
    const mode: "payment" | "subscription" = hasRecurring
      ? "subscription"
      : "payment";

    // Build line items with Stripe price IDs
    const lineItems = await Promise.all(
      products.map(async (product) => {
        const resolved = await resolveStripePriceId(product, config.mode);
        return {
          priceId: resolved.priceId,
          quantity: product.quantity,
          productId: product.id,
        };
      }),
    );

    // Metadata to pass through Stripe for the success callback
    const metadata: Record<string, string> = {
      internalItems: JSON.stringify(
        products.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          amount: p.price,
          currency: p.currency,
        })),
      ),
    };
    if (userId) metadata.userId = userId;

    const provider = getPaymentProvider(config.provider);

    const sessionInput: CreateSessionInput = {
      lineItems,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      mode,
      metadata,
    };

    // If we have a pre-collected guest email, pass it to Stripe to pre-fill
    if (!userId && input.guestEmail) {
      sessionInput.customerEmail = input.guestEmail;
    }

    // If authenticated, link or create Stripe customer so billing portal works
    if (userId) {
      const user = await userRepository.findById(userId);
      if (user) {
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          customerId = await provider.findOrCreateCustomer(
            user.email,
            user.name,
            config,
          );
          await userRepository.update(userId, { stripeCustomerId: customerId });
        }
        sessionInput.customerEmail = undefined;
        sessionInput.metadata = {
          ...sessionInput.metadata,
          stripeCustomerId: customerId,
        };
        // Pass customer directly (Stripe checkout supports customer param)
        sessionInput.customerId = customerId;
      }
    }

    const result = await provider.createCheckoutSession(sessionInput, config);

    // Store checkout session in DB
    await checkoutRepository.create({
      sessionId: result.sessionId,
      userId: userId || undefined,
      guestEmail: input.guestEmail,
      guestName: input.guestName,
      items: input.items,
      provider: config.provider,
    });

    return result;
  },

  async verifySession(sessionId: string) {
    // Look up our stored session
    const checkoutSession = await checkoutRepository.findBySessionId(sessionId);
    if (!checkoutSession) {
      throw new Error("Checkout session not found.");
    }

    if (checkoutSession.status === "completed") {
      throw new Error("This checkout session has already been processed.");
    }

    // Verify with payment provider
    const config = await getPaymentConfig();
    const provider = getPaymentProvider(config.provider);
    const verified = await provider.verifySession(sessionId, config);

    if (verified.paymentStatus !== "paid") {
      throw new Error("Payment has not been completed.");
    }

    // Determine or create the user
    let userId = checkoutSession.userId;
    let createdUser = null;

    if (!userId) {
      // Guest checkout — find existing user by email or create new
      const email = (verified.customerEmail ?? checkoutSession.guestEmail ?? "")
        .toLowerCase()
        .trim();
      if (!email) {
        throw new Error("No email associated with this checkout.");
      }

      const existingUser = await userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create a new user with a random password
        const randomPassword = crypto.randomBytes(24).toString("base64url");
        const passwordHash = hashPassword(randomPassword);
        const name =
          verified.customerName ||
          checkoutSession.guestName ||
          email.split("@")[0];

        const newUser = await userRepository.create({
          name,
          email,
          passwordHash,
          status: "active",
        });
        userId = newUser.id;
        createdUser = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        };
      }
    }

    // Create purchases for each item
    const items = checkoutSession.items as {
      productId: string;
      quantity: number;
    }[];
    const purchases = [];

    // Link Stripe customer ID to user if available
    if (userId && verified.customerId) {
      await userRepository.update(userId, {
        stripeCustomerId: verified.customerId,
      });
    }

    for (const item of items) {
      const purchase = await purchaseService.create(userId, item.productId, {
        externalId: sessionId,
      });
      purchases.push(purchase);
    }

    // Mark session as completed
    await checkoutRepository.updateStatus(checkoutSession.id, "completed");

    return {
      purchases: purchases.map((p) => ({
        id: p.id,
        productId: p.productId,
        amount: p.amount,
        status: p.status,
        product: p.product ? { name: p.product.name } : undefined,
      })),
      user: createdUser || undefined,
    };
  },
};
