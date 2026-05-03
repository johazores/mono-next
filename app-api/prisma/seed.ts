import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  // Seed plans
  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Basic access with limited features",
      price: 0,
      currency: "USD",
      interval: "month",
      features: ["Basic access", "Community support"],
      sortOrder: 0,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For individuals getting started",
      price: 9.99,
      currency: "USD",
      interval: "month",
      features: ["Everything in Free", "Email support", "5 GB storage"],
      sortOrder: 1,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For professionals and small teams",
      price: 29.99,
      currency: "USD",
      interval: "month",
      features: [
        "Everything in Starter",
        "Priority support",
        "50 GB storage",
        "API access",
      ],
      sortOrder: 2,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "For large organizations with custom needs",
      price: 99.99,
      currency: "USD",
      interval: "month",
      features: [
        "Everything in Pro",
        "Dedicated support",
        "Unlimited storage",
        "Custom integrations",
        "SLA",
      ],
      sortOrder: 3,
    },
  ];

  const seededPlans: Record<string, string> = {};
  for (const plan of plans) {
    const created = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
    seededPlans[plan.slug] = created.id;
    console.log("Plan seeded:", plan.name);
  }

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

  // Assign starter plan to demo user (cancel existing first)
  await prisma.subscription.updateMany({
    where: { userId: user.id, status: "active" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: seededPlans["starter"],
      status: "active",
    },
  });
  console.log("Subscription assigned: Demo User -> Starter");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
