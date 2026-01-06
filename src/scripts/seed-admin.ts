import bcrypt from "bcrypt";
import {prisma} from "../db.js";

const run = async () => {
  const passwordHash = await bcrypt.hash("admin123", 10);

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
