import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/auth.js";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import { UserRole, VendorStatus } from "../generated/prisma/enums.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie("access_token", token, {
    httpOnly: true, // ✅ prevents JS access
    secure: process.env.NODE_ENV !== "development", // ✅ true in production (HTTPS)
    sameSite: "strict", // ✅ CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day

  });
  return res.json({
    message: "Login successful",
    user: {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
  //   return res.json({ message: "Login successful" });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("access_token");
  return res.json({ message: "Logged out successfully" });
};




export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current and new password are required",
    });
  }

  // Validate password strength
  const { validatePasswordStrength, checkCommonPasswords } = await import("../utils/password-validation.js");

  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    return res.status(400).json({
      message: "Password does not meet security requirements",
      errors: validation.errors,
    });
  }

  if (checkCommonPasswords(newPassword)) {
    return res.status(400).json({
      message: "Password is too common. Please choose a more secure password.",
    });
  }

  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isMatch) {
    return res.status(400).json({
      message: "Current password is incorrect",
    });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return res.json({ message: "Password updated successfully" });
};

/**
 * Get profile of authenticated user
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Base profile
  const profile: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  // Include school info for school-scoped users
  if (user.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { id: true, name: true, code: true },
    });

    if (school) profile.school = school;
  }

  // Include vendor-specific fields for vendors
  if (user.role === "VENDOR") {
    profile.vendorName = user.vendorName;
    profile.phoneNumber = user.phoneNumber;
    profile.location = user.location;
    profile.vendorStatus = user.vendorStatus;
  }

  return res.json({ profile });
};

/**
 * Update authenticated user's own profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const user = req.user;

  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { email, vendorName, phoneNumber, location } = req.body as {
    email?: string;
    vendorName?: string;
    phoneNumber?: string;
    location?: string;
  };

  if (!email && vendorName === undefined && phoneNumber === undefined && location === undefined) {
    return res.status(400).json({ message: "At least one field is required to update" });
  }

  // Email uniqueness check
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  const updateData: any = {};
  if (email !== undefined) updateData.email = email;
  if (vendorName !== undefined) updateData.vendorName = vendorName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (location !== undefined) updateData.location = location;

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        vendorName: true,
        phoneNumber: true,
        location: true,
        vendorStatus: true,
        schoolId: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * Admin (SUPER_ADMIN) update user by id
 */
export const adminUpdateUser = async (req: AuthRequest, res: Response) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ message: "Unauthorized" });

  const targetId = Number(req.params.id);
  const {
    email,
    role,
    isActive,
    vendorName,
    phoneNumber,
    location,
    vendorStatus,
    schoolId,
    mustChangePassword,
  } = req.body as Record<string, any>;

  // Only SUPER_ADMIN should call this route (route will enforce), but keep a safeguard
  if (actor.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!email && role === undefined && isActive === undefined && vendorName === undefined && phoneNumber === undefined && location === undefined && vendorStatus === undefined && schoolId === undefined && mustChangePassword === undefined) {
    return res.status(400).json({ message: "At least one field is required to update" });
  }

  // Validate role
  if (role !== undefined && !Object.values(UserRole).includes(role)) {
    return res.status(400).json({ message: `Invalid role: ${role}` });
  }

  if (vendorStatus !== undefined && !Object.values(VendorStatus).includes(vendorStatus)) {
    return res.status(400).json({ message: `Invalid vendorStatus: ${vendorStatus}` });
  }

  // Email uniqueness
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== targetId) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  const updateData: any = {};
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (vendorName !== undefined) updateData.vendorName = vendorName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (location !== undefined) updateData.location = location;
  if (vendorStatus !== undefined) updateData.vendorStatus = vendorStatus;
  if (schoolId !== undefined) updateData.schoolId = schoolId;
  if (mustChangePassword !== undefined) updateData.mustChangePassword = mustChangePassword;

  try {
    const updated = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        vendorName: true,
        phoneNumber: true,
        location: true,
        vendorStatus: true,
        schoolId: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({ message: "User updated", user: updated });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(500).json({ message: "Failed to update user" });
  }
};

/**
 * Admin (SUPER_ADMIN) get user by id
 */
export const getUser = async (req: AuthRequest, res: Response) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ message: "Unauthorized" });

  if (actor.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const userId = Number(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        vendorName: true,
        phoneNumber: true,
        location: true,
        vendorStatus: true,
        schoolId: true,
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Include school info if user is assigned to a school
    let userWithSchool: any = { ...user };
    if (user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { id: true, name: true, code: true },
      });
      if (school) userWithSchool.school = school;
    }

    return res.json(userWithSchool);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

/**
 * Admin (SUPER_ADMIN) get all users with optional filters
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ message: "Unauthorized" });

  if (actor.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { role, schoolId, isActive, search, limit = "10", page = "1" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {};

    if (role) {
      if (!Object.values(UserRole).includes(role as any)) {
        return res.status(400).json({ message: `Invalid role: ${role}` });
      }
      where.role = role;
    }

    if (schoolId) {
      where.schoolId = Number(schoolId);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { vendorName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          school: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};



/**
 * Admin (SUPER_ADMIN) get all school admins with their schools
 */
export const getAllSchoolAdmins = async (req: AuthRequest, res: Response) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ message: "Unauthorized" });

  if (actor.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { schoolId, isActive, search, limit = "10", page = "1" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {
      role: UserRole.SCHOOL_ADMIN,
    };

    if (schoolId) {
      where.schoolId = Number(schoolId);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          school: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      data: admins,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch school admins" });
  }
};
