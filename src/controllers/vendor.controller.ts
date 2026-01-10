import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import bcrypt from "bcrypt";
import { prisma } from "../db.js";
import { generateTempPassword } from "../utils/password.js";
import { sendSchoolAdminCredentials } from "../utils/mailer.js";

export const registerVendor = async (
  req: AuthRequest,
  res: Response
) => {
  const { vendorName, email, phoneNumber, location } = req.body as {
    vendorName?: string;
    email?: string;
    phoneNumber?: string;
    location?: string;
  };

  // RBAC
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validation
  if (!vendorName || !email || !phoneNumber || !location) {
    return res.status(400).json({
      message: "vendorName, email, phoneNumber and location are required",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Vendor with this email already exists",
      });
    }

    const tempPassword = generateTempPassword(10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "VENDOR",
        vendorName,
        phoneNumber,
        location,
        vendorStatus: "ONBOARDING",
        mustChangePassword: true,
        isActive: true,
      },
    });

    // Reuse existing mailer (rename later if you want)
    await sendSchoolAdminCredentials({
      to: email,
      schoolCode: "VENDOR-PORTAL",
      password: tempPassword,
    });

    return res.status(201).json({
      message: "Vendor registered and credentials sent via email",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to register vendor",
    });
  }
};
