import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  const count = await prisma.admin.count();
  if (count > 0) {
    console.log("Admins already exist, skipping seed.");
    return;
  }

  const admin = await prisma.admin.create({
    data: {
      name: "Admin",
      email: "admin@admin.com",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "admin",
      status: "active",
    },
  });

  console.log("Default admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
