import type { Request, Response } from "express";
import {prisma} from "../db.js";

/**
 * Create a school
 */
export const createSchool = async (req: Request, res: Response) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "School name and code are required",
    });
  }

  try {
    const school = await prisma.school.create({
      data: { name, code },
    });

    return res.status(201).json(school);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "School code already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create school"+error.message,
    });
  }
};

/**
 * Get all schools
 */
export const getSchools = async (_req: Request, res: Response) => {
  const schools = await prisma.school.findMany({
    orderBy: { id: "asc" },
  });

  return res.json(schools);
};

// register school

import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import bcrypt from "bcrypt";

import { generateTempPassword } from "../utils/password.js";
import { sendSchoolAdminCredentials } from "../utils/mailer.js";
import type { Prisma } from "../generated/prisma/client.js";

export const registerSchoolWithAdmin = async (
  req: AuthRequest,
  res: Response
) => {
  const { name, code, adminEmail } = req.body as {
    name?: string;
    code?: string;
    adminEmail?: string;
  };

  if (!name || !code || !adminEmail) {
    return res.status(400).json({
      message: "name, code and adminEmail are required",
    });
  }

  // RBAC
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // Check duplicates early
    const existingSchool = await prisma.school.findUnique({
      where: { code },
      select: { id: true },
    });
    if (existingSchool) {
      return res.status(409).json({ message: "School code already exists" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      return res.status(409).json({ message: "Admin email already exists" });
    }

    // Transaction keeps data consistent
    const result = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
      const school = await tx.school.create({
        data: { name, code },
      });

      const tempPassword = generateTempPassword(10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "SCHOOL_ADMIN",
          schoolId: school.id,
        },
      });

      // Send email AFTER DB success
      await sendSchoolAdminCredentials({
        to: adminEmail,
        schoolCode: code,
        password: tempPassword,
      });

      return school;
    });

    return res.status(201).json({
      message: "School created and admin credentials sent via email",
      schoolId: result.id,
    });
  } catch (error: any) {
    // Prisma unique constraint
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Duplicate entry detected" });
    }
    return res.status(500).json({
      message: "Failed to register school",
    });
  }
};
