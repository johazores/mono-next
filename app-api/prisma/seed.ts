import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
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
      interval: "month",
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
      interval: "month",
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
      interval: "month",
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
      interval: "month",
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
      interval: "month",
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
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
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
      where: { key: feature.key },
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
    where: { email: "user@demo.com" },
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
    where: { email: "sub@demo.com" },
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

  // Assign inherited subscription to sub-user (amount=0, same product as parent)
  await prisma.purchase.updateMany({
    where: {
      userId: subUser.id,
      status: "active",
      product: { paymentModel: "recurring" },
    },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  const subPurchase = await prisma.purchase.create({
    data: {
      userId: subUser.id,
      productId: seededProducts["starter"],
      amount: 0,
      currency: "USD",
      status: "active",
    },
  });
  console.log(
    "Inherited subscription assigned: Demo Sub-User -> Starter (via parent)",
  );

  // Grant inherited membership to sub-user
  await prisma.membership.deleteMany({
    where: { userId: subUser.id, type: "purchase" },
  });
  await prisma.membership.create({
    data: {
      userId: subUser.id,
      type: "purchase",
      sourceId: subPurchase.id,
      featureKeys: starterProduct.accessKeys,
      status: "active",
    },
  });
  console.log(
    "Membership granted: Demo Sub-User -> Starter features (inherited)",
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
