import bcrypt from "bcrypt";
import { prisma } from "../db.js";

const run = async () => {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const existing = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existing) {
    console.log("SUPER_ADMIN already exists. Skipping seed.");
    return;
  }

  await prisma.user.create({
    data: {
      email: "admin@vendor.com",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("SUPER_ADMIN created");
};

run()
  .catch(console.error)
  .finally(() => process.exit());
