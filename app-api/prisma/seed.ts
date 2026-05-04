import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { getAppEnv } from "../lib/env";

async function main() {
  const env = getAppEnv();
  console.log(`Seeding for environment: ${env}\n`);
  // Seed products (includes subscription plans and one-time purchases)
  const products = [
    {
      name: "Free",
      slug: "free",
      description: "Basic access with limited features",
      type: "membership" as const,
      price: 0,
      currency: "USD",
      paymentModel: "recurring" as const,
      maxSubUsers: 0,
      accessKeys: ["storage.1gb", "support.community"],
      sortOrder: 0,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For individuals getting started",
      type: "membership" as const,
      price: 9.99,
      currency: "USD",
      paymentModel: "recurring" as const,
      maxSubUsers: 3,
      accessKeys: ["storage.5gb", "support.email", "sub-users.create"],
      sortOrder: 1,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For professionals and small teams",
      type: "membership" as const,
      price: 29.99,
      currency: "USD",
      paymentModel: "recurring" as const,
      maxSubUsers: 10,
      accessKeys: [
        "storage.50gb",
        "support.priority",
        "api.access",
        "sub-users.create",
        "reports.advanced",
        "products.digital-downloads",
      ],
      sortOrder: 2,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "For large organizations with custom needs",
      type: "membership" as const,
      price: 99.99,
      currency: "USD",
      paymentModel: "recurring" as const,
      maxSubUsers: -1,
      accessKeys: [
        "storage.unlimited",
        "support.dedicated",
        "api.access",
        "sub-users.create",
        "reports.advanced",
        "integrations.custom",
        "products.digital-downloads",
      ],
      sortOrder: 3,
    },
    {
      name: "SEO Report",
      slug: "seo-report",
      description: "Comprehensive SEO analysis report",
      type: "digital" as const,
      price: 49.99,
      currency: "USD",
      paymentModel: "one-time" as const,
      accessKeys: ["reports.advanced"],
      sortOrder: 10,
    },
    {
      name: "API Access Pass",
      slug: "api-access-pass",
      description: "Lifetime API access",
      type: "digital" as const,
      price: 199.99,
      currency: "USD",
      paymentModel: "one-time" as const,
      accessKeys: ["api.access"],
      sortOrder: 11,
    },
    {
      name: "Premium Membership",
      slug: "premium-membership",
      description: "Premium membership with all features",
      type: "membership" as const,
      price: 19.99,
      currency: "USD",
      paymentModel: "recurring" as const,
      accessKeys: [
        "reports.advanced",
        "api.access",
        "products.digital-downloads",
      ],
      sortOrder: 12,
    },
  ];

  const seededProducts: Record<string, string> = {};
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { env_slug: { env, slug: product.slug } },
      update: {
        name: product.name,
        description: product.description,
        type: product.type,
        price: product.price,
        currency: product.currency,
        paymentModel: product.paymentModel,
        accessKeys: product.accessKeys,
        maxSubUsers: product.maxSubUsers ?? 0,
        sortOrder: product.sortOrder,
      },
      create: product,
    });
    seededProducts[product.slug] = created.id;
    console.log("Product seeded:", product.name);
  }

  // Seed features
  const features = [
    {
      key: "storage.1gb",
      description: "1 GB storage",
      category: "storage",
      sortOrder: 0,
    },
    {
      key: "storage.5gb",
      description: "5 GB storage",
      category: "storage",
      sortOrder: 1,
    },
    {
      key: "storage.50gb",
      description: "50 GB storage",
      category: "storage",
      sortOrder: 2,
    },
    {
      key: "storage.unlimited",
      description: "Unlimited storage",
      category: "storage",
      sortOrder: 3,
    },
    {
      key: "support.community",
      description: "Community support",
      category: "support",
      sortOrder: 0,
    },
    {
      key: "support.email",
      description: "Email support",
      category: "support",
      sortOrder: 1,
    },
    {
      key: "support.priority",
      description: "Priority support",
      category: "support",
      sortOrder: 2,
    },
    {
      key: "support.dedicated",
      description: "Dedicated support",
      category: "support",
      sortOrder: 3,
    },
    {
      key: "api.access",
      description: "API access",
      category: "features",
      sortOrder: 0,
    },
    {
      key: "sub-users.create",
      description: "Create sub-users",
      category: "features",
      sortOrder: 1,
    },
    {
      key: "reports.advanced",
      description: "Advanced reports",
      category: "features",
      sortOrder: 2,
    },
    {
      key: "integrations.custom",
      description: "Custom integrations",
      category: "features",
      sortOrder: 3,
    },
    {
      key: "products.digital-downloads",
      description: "Access digital downloads",
      category: "features",
      sortOrder: 4,
    },
  ];

  for (const feature of features) {
    await prisma.feature.upsert({
      where: { env_key: { env, key: feature.key } },
      update: {
        description: feature.description,
        category: feature.category,
        sortOrder: feature.sortOrder,
      },
      create: feature,
    });
  }
  console.log(`Features seeded: ${features.length} definitions`);

  // Seed admin
  const adminHash = hashPassword("ChangeMe123!");
  const admin = await prisma.admin.upsert({
    where: { email: "admin@admin.com" },
    update: { passwordHash: adminHash },
    create: {
      name: "Admin",
      email: "admin@admin.com",
      passwordHash: adminHash,
      role: "admin",
      status: "active",
    },
  });
  console.log("Admin seeded:", admin.email);

  // Seed user
  const userHash = hashPassword("ChangeMe123!");
  const user = await prisma.user.upsert({
    where: { env_email: { env, email: "user@demo.com" } },
    update: { passwordHash: userHash },
    create: {
      name: "Demo User",
      email: "user@demo.com",
      passwordHash: userHash,
      status: "active",
    },
  });
  console.log("User seeded:", user.email);

  // Assign starter subscription to demo user (cancel existing first)
  await prisma.purchase.updateMany({
    where: {
      userId: user.id,
      status: "active",
      product: { paymentModel: "recurring" },
    },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      productId: seededProducts["starter"],
      amount: 9.99,
      currency: "USD",
      status: "active",
    },
  });
  console.log("Subscription assigned: Demo User -> Starter");

  // Grant membership from subscription so feature checks work
  const starterProduct = products.find((p) => p.slug === "starter")!;
  await prisma.membership.deleteMany({
    where: { userId: user.id, type: "purchase" },
  });
  await prisma.membership.create({
    data: {
      userId: user.id,
      type: "purchase",
      sourceId: purchase.id,
      featureKeys: starterProduct.accessKeys,
      status: "active",
    },
  });
  console.log("Membership granted: Demo User -> Starter features");

  // Seed a sub-user under the demo user to exercise the hierarchy system
  const subUserHash = hashPassword("ChangeMe123!");
  const subUser = await prisma.user.upsert({
    where: { env_email: { env, email: "sub@demo.com" } },
    update: {
      passwordHash: subUserHash,
      parentId: user.id,
      ancestors: [user.id],
    },
    create: {
      name: "Demo Sub-User",
      email: "sub@demo.com",
      passwordHash: subUserHash,
      status: "active",
      parentId: user.id,
      ancestors: [user.id],
    },
  });
  console.log("Sub-user seeded:", subUser.email);

  // Sub-users inherit their parent's plan dynamically at runtime —
  // no purchase or membership needs to be created here.

  // Seed default site settings
  const defaultSettings = [
    { key: "auth.provider", value: "credentials" },
    { key: "auth.clerkPublishableKey", value: "" },
    { key: "auth.clerkSecretKey", value: "" },
    { key: "payment.provider", value: "stripe" },
    { key: "payment.mode", value: "test" },
    { key: "payment.stripe.testPublicKey", value: "" },
    { key: "payment.stripe.testSecretKey", value: "" },
    { key: "payment.stripe.livePublicKey", value: "" },
    { key: "payment.stripe.liveSecretKey", value: "" },
  ];
  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { env_key: { env, key: setting.key } },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log("Default site settings seeded");

  // Seed product prices (multiple prices per product with date ranges)
  const pricesToSeed = [
    // Free plan — $0 test price
    {
      productSlug: "free",
      label: "Free Plan",
      stripePriceId: "price_test_free",
      mode: "test" as const,
      amount: 0,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    // Starter — monthly test price
    {
      productSlug: "starter",
      label: "Starter Monthly",
      stripePriceId: "price_test_starter_monthly",
      mode: "test" as const,
      amount: 9.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    // Starter — yearly test price (discounted)
    {
      productSlug: "starter",
      label: "Starter Yearly",
      stripePriceId: "price_test_starter_yearly",
      mode: "test" as const,
      amount: 99.99,
      currency: "USD",
      interval: "year",
      isDefault: false,
    },
    // Pro — monthly test price
    {
      productSlug: "pro",
      label: "Pro Monthly",
      stripePriceId: "price_test_pro_monthly",
      mode: "test" as const,
      amount: 29.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    // Enterprise — monthly test price
    {
      productSlug: "enterprise",
      label: "Enterprise Monthly",
      stripePriceId: "price_test_enterprise_monthly",
      mode: "test" as const,
      amount: 99.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    // Premium — monthly test price
    {
      productSlug: "premium-membership",
      label: "Premium Monthly",
      stripePriceId: "price_test_premium_monthly",
      mode: "test" as const,
      amount: 19.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    // SEO Report — one-time test price
    {
      productSlug: "seo-report",
      label: "SEO Report",
      stripePriceId: "price_test_seo_report",
      mode: "test" as const,
      amount: 49.99,
      currency: "USD",
      interval: null,
      isDefault: true,
    },
    // API Access Pass — one-time test price
    {
      productSlug: "api-access-pass",
      label: "API Access Pass",
      stripePriceId: "price_test_api_access",
      mode: "test" as const,
      amount: 199.99,
      currency: "USD",
      interval: null,
      isDefault: true,
    },
    // --- Live-mode placeholder prices (replace stripePriceId with real Stripe IDs) ---
    {
      productSlug: "free",
      label: "Free Plan",
      stripePriceId: "price_live_free",
      mode: "live" as const,
      amount: 0,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    {
      productSlug: "starter",
      label: "Starter Monthly",
      stripePriceId: "price_live_starter_monthly",
      mode: "live" as const,
      amount: 9.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    {
      productSlug: "starter",
      label: "Starter Yearly",
      stripePriceId: "price_live_starter_yearly",
      mode: "live" as const,
      amount: 99.99,
      currency: "USD",
      interval: "year",
      isDefault: false,
    },
    {
      productSlug: "pro",
      label: "Pro Monthly",
      stripePriceId: "price_live_pro_monthly",
      mode: "live" as const,
      amount: 29.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    {
      productSlug: "enterprise",
      label: "Enterprise Monthly",
      stripePriceId: "price_live_enterprise_monthly",
      mode: "live" as const,
      amount: 99.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    {
      productSlug: "premium-membership",
      label: "Premium Monthly",
      stripePriceId: "price_live_premium_monthly",
      mode: "live" as const,
      amount: 19.99,
      currency: "USD",
      interval: "month",
      isDefault: true,
    },
    {
      productSlug: "seo-report",
      label: "SEO Report",
      stripePriceId: "price_live_seo_report",
      mode: "live" as const,
      amount: 49.99,
      currency: "USD",
      interval: null,
      isDefault: true,
    },
    {
      productSlug: "api-access-pass",
      label: "API Access Pass",
      stripePriceId: "price_live_api_access",
      mode: "live" as const,
      amount: 199.99,
      currency: "USD",
      interval: null,
      isDefault: true,
    },
  ];

  for (const p of pricesToSeed) {
    const productId = seededProducts[p.productSlug];
    if (!productId) continue;

    // Find existing price by product + mode + label to upsert
    const existing = await prisma.productPrice.findFirst({
      where: { productId, mode: p.mode, label: p.label },
    });

    if (existing) {
      await prisma.productPrice.update({
        where: { id: existing.id },
        data: {
          stripePriceId: p.stripePriceId,
          amount: p.amount,
          currency: p.currency,
          interval: p.interval,
          isDefault: p.isDefault,
        },
      });
    } else {
      await prisma.productPrice.create({
        data: {
          productId,
          label: p.label,
          stripePriceId: p.stripePriceId,
          mode: p.mode,
          amount: p.amount,
          currency: p.currency,
          interval: p.interval,
          startDate: new Date(),
          isDefault: p.isDefault,
        },
      });
    }
    console.log(`ProductPrice seeded: ${p.label} (${p.mode})`);
  }

  // Seed sample purchase file for demo user's starter subscription
  const sampleFileContent = Buffer.from(
    "Welcome to Starter! This is your getting-started guide.",
    "utf-8",
  ).toString("base64");
  const existingFile = await prisma.purchaseFile.findFirst({
    where: { purchaseId: purchase.id, fileName: "starter-guide.txt" },
  });
  if (!existingFile) {
    await prisma.purchaseFile.create({
      data: {
        purchaseId: purchase.id,
        fileName: "starter-guide.txt",
        mimeType: "text/plain",
        sizeBytes: Buffer.from(sampleFileContent, "base64").length,
        data: sampleFileContent,
      },
    });
    console.log("PurchaseFile seeded: starter-guide.txt for Demo User");
  } else {
    console.log("PurchaseFile already exists: starter-guide.txt");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
