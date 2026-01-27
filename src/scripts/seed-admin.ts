import bcrypt from "bcrypt";
import { prisma } from "../db.js";

const run = async () => {
  // Validate required environment variables
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@vendor.com";

  if (!adminPassword) {
    console.error(
      "FATAL: ADMIN_PASSWORD environment variable is not set. " +
      "This is required to create the super admin account. " +
      "Please set ADMIN_PASSWORD in your .env file."
    );
    process.exit(1);
  }

  // Warn if using default email
  if (adminEmail === "admin@vendor.com") {
    console.warn(
      "WARNING: Using default admin email (admin@vendor.com). " +
      "Consider setting ADMIN_EMAIL environment variable for production."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existing) {
    console.log("SUPER_ADMIN already exists. Skipping seed.");
    return;
  }

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`SUPER_ADMIN created with email: ${adminEmail}`);
};

run()
  .catch(console.error)
  .finally(() => process.exit());
