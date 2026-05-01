import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("Users already exist, skipping seed.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@admin.com",
      passwordHash: hashPassword("ChangeMe123!"),
      role: "admin",
      status: "active",
    },
  });

  console.log("Default admin user created:", user.email);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
