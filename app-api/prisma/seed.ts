import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
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

  const userHash = hashPassword("ChangeMe123!");
  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: { passwordHash: userHash },
    create: {
      name: "Demo User",
      email: "user@demo.com",
      passwordHash: userHash,
      plan: "starter",
      status: "active",
    },
  });
  console.log("User seeded:", user.email);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
