import bcrypt from "bcrypt";
import {prisma} from "../db.js";

const run = async () => {
  const passwordHash = await bcrypt.hash("schooladmin123", 10);

  await prisma.user.create({
    data: {
      email: "admin@abcschool.com",
      passwordHash,
      role: "SCHOOL_ADMIN",
      schoolId: 1, 
    },
  });

  console.log("SCHOOL_ADMIN created");
};

run()
  .catch(console.error)
  .finally(() => process.exit());
