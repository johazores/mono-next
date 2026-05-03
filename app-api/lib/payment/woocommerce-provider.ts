/**
 * WooCommerce payment provider — placeholder for future implementation.
 *
 * This provider will integrate with the WooCommerce REST API to support:
 * - Checkout via WooCommerce orders
 * - Subscription management via WooCommerce Subscriptions plugin
 * - Customer management
 * - Invoice/order history
 *
 * WooCommerce REST API docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
 * WooCommerce Subscriptions API: https://woocommerce.github.io/subscriptions-rest-api-docs/
 */

// import type {
//   PaymentProviderInterface,
//   CreateSessionInput,
//   CreateSessionResult,
//   VerifiedSession,
//   BillingPortalResult,
//   StripeSubscription,
//   StripeInvoice,
// } from "./types";
// import type { PaymentConfig } from "@/types";
//
// // --- WooCommerce-specific types ---
//
// type WooCommerceConfig = {
//   siteUrl: string;          // e.g. https://shop.example.com
//   consumerKey: string;      // WooCommerce REST API consumer key
//   consumerSecret: string;   // WooCommerce REST API consumer secret
// };
//
// function getWooConfig(config: PaymentConfig): WooCommerceConfig {
//   return {
//     siteUrl: config.secretKey, // repurpose or add dedicated fields
//     consumerKey: "",
//     consumerSecret: "",
//   };
// }
//
// async function wooRequest<T>(
//   endpoint: string,
//   wooConfig: WooCommerceConfig,
//   options: { method?: string; body?: Record<string, unknown> } = {},
// ): Promise<T> {
//   const url = `${wooConfig.siteUrl}/wp-json/wc/v3${endpoint}`;
//   const auth = Buffer.from(
//     `${wooConfig.consumerKey}:${wooConfig.consumerSecret}`,
//   ).toString("base64");
//
//   const res = await fetch(url, {
//     method: options.method ?? "GET",
//     headers: {
//       Authorization: `Basic ${auth}`,
//       "Content-Type": "application/json",
//     },
//     body: options.body ? JSON.stringify(options.body) : undefined,
//   });
//
//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`WooCommerce API error ${res.status}: ${text}`);
//   }
//
//   return res.json() as Promise<T>;
// }
//
// export const woocommerceProvider: PaymentProviderInterface = {
//   async createCheckoutSession(
//     input: CreateSessionInput,
//     config: PaymentConfig,
//   ): Promise<CreateSessionResult> {
//     // Create a WooCommerce order and return the checkout URL
//     // const woo = getWooConfig(config);
//     // const order = await wooRequest<{ id: number; checkout_url: string }>(
//     //   "/orders",
//     //   woo,
//     //   {
//     //     method: "POST",
//     //     body: {
//     //       line_items: input.lineItems.map((li) => ({
//     //         product_id: li.productId,
//     //         quantity: li.quantity,
//     //       })),
//     //       // Map metadata, customer email, etc.
//     //     },
//     //   },
//     // );
//     // return { sessionId: String(order.id), redirectUrl: order.checkout_url };
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
//
//   async verifySession(
//     sessionId: string,
//     config: PaymentConfig,
//   ): Promise<VerifiedSession> {
//     // Fetch the WooCommerce order by ID and check payment status
//     // const woo = getWooConfig(config);
//     // const order = await wooRequest<WooOrder>(`/orders/${sessionId}`, woo);
//     // return { sessionId, paymentStatus: mapWooStatus(order.status), ... };
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
//
//   async findOrCreateCustomer(
//     email: string,
//     name: string | undefined,
//     config: PaymentConfig,
//   ): Promise<string> {
//     // Search WooCommerce customers by email, create if not found
//     // const woo = getWooConfig(config);
//     // const customers = await wooRequest<WooCustomer[]>(
//     //   `/customers?email=${encodeURIComponent(email)}`,
//     //   woo,
//     // );
//     // if (customers.length > 0) return String(customers[0].id);
//     // const created = await wooRequest<WooCustomer>("/customers", woo, {
//     //   method: "POST",
//     //   body: { email, first_name: name ?? "" },
//     // });
//     // return String(created.id);
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
//
//   async createBillingPortalSession(
//     customerId: string,
//     returnUrl: string,
//     config: PaymentConfig,
//   ): Promise<BillingPortalResult> {
//     // WooCommerce doesn't have a native billing portal.
//     // Return the "My Account" page URL instead.
//     // const woo = getWooConfig(config);
//     // return { url: `${woo.siteUrl}/my-account/` };
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
//
//   async getCustomerSubscriptions(
//     customerId: string,
//     config: PaymentConfig,
//   ): Promise<StripeSubscription[]> {
//     // Requires WooCommerce Subscriptions plugin
//     // const woo = getWooConfig(config);
//     // const subs = await wooRequest<WooSubscription[]>(
//     //   `/subscriptions?customer=${customerId}`,
//     //   woo,
//     // );
//     // return subs.map((sub) => ({
//     //   id: String(sub.id),
//     //   status: sub.status,
//     //   currentPeriodEnd: new Date(sub.next_payment_date).getTime() / 1000,
//     //   cancelAtPeriodEnd: sub.status === "pending-cancel",
//     //   interval: sub.billing_period, // day | week | month | year
//     //   items: sub.line_items.map((li) => ({
//     //     priceId: String(li.product_id),
//     //     productId: String(li.product_id),
//     //   })),
//     // }));
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
//
//   async getCustomerInvoices(
//     customerId: string,
//     config: PaymentConfig,
//   ): Promise<StripeInvoice[]> {
//     // Fetch completed orders as "invoices"
//     // const woo = getWooConfig(config);
//     // const orders = await wooRequest<WooOrder[]>(
//     //   `/orders?customer=${customerId}&status=completed&per_page=50`,
//     //   woo,
//     // );
//     // return orders.map((order) => ({
//     //   id: String(order.id),
//     //   status: order.status === "completed" ? "paid" : order.status,
//     //   amountPaid: parseFloat(order.total),
//     //   currency: order.currency.toLowerCase(),
//     //   subscriptionId: null,
//     //   stripeProductId: null,
//     //   stripePriceId: null,
//     //   periodStart: new Date(order.date_created).getTime() / 1000,
//     //   periodEnd: new Date(order.date_created).getTime() / 1000,
//     //   hostedUrl: order.order_key
//     //     ? `${woo.siteUrl}/my-account/view-order/${order.id}/`
//     //     : null,
//     //   pdfUrl: null, // Would need a PDF invoice plugin
//     //   created: new Date(order.date_created).getTime() / 1000,
//     // }));
//     throw new Error("WooCommerce provider not yet implemented.");
//   },
// };
