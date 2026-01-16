import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import bcrypt from "bcrypt";
import { prisma } from "../db.js";
import { generateTempPassword } from "../utils/password.js";
import { sendSchoolAdminCredentials } from "../utils/mailer.js";
import { UserRole, VendorStatus } from "../generated/prisma/enums.js";

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
        vendorStatus: "ACTIVE",
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

/**
 * Admin (SUPER_ADMIN) get all vendors with optional filters
 */
export const getAllVendors = async (req: AuthRequest, res: Response) => {
  const actor = req.user;
  if (!actor) return res.status(401).json({ message: "Unauthorized" });

  if (actor.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { vendorStatus, isActive, search, limit = "10", page = "1" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {
      role: UserRole.VENDOR,
    };

    if (vendorStatus) {
      if (!Object.values(VendorStatus).includes(vendorStatus as any)) {
        return res.status(400).json({ message: `Invalid vendorStatus: ${vendorStatus}` });
      }
      where.vendorStatus = vendorStatus;
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

    const [vendors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          vendorName: true,
          phoneNumber: true,
          location: true,
          vendorStatus: true,
          isActive: true,
          createdAt: true,
          schoolIds: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      data: vendors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vendors" });
  }
};

/**
 * Assign a school to a vendor
 */
export const assignSchoolToVendor = async (
  req: AuthRequest,
  res: Response
) => {
  const { vendorId } = req.params;
  const { schoolId } = req.body as { schoolId?: number };

  // RBAC: Only SUPER_ADMIN can assign schools
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validation
  if (!vendorId || isNaN(Number(vendorId))) {
    return res.status(400).json({ message: "Valid vendorId is required" });
  }

  if (!schoolId || isNaN(Number(schoolId))) {
    return res.status(400).json({ message: "Valid schoolId is required" });
  }

  try {
    // Verify vendor exists and is actually a VENDOR
    const vendor = await prisma.user.findUnique({
      where: { id: Number(vendorId) },
      select: { id: true, role: true, schoolIds: true },
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.role !== "VENDOR") {
      return res.status(400).json({ message: "User is not a vendor" });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
      select: { id: true, name: true, code: true },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Check if school is already assigned
    if (vendor.schoolIds.includes(Number(schoolId))) {
      return res.status(409).json({
        message: "Vendor is already assigned to this school",
      });
    }

    // Add school to vendor's schoolIds array
    const updatedVendor = await prisma.user.update({
      where: { id: Number(vendorId) },
      data: {
        schoolIds: {
          push: Number(schoolId),
        },
      },
    });

    return res.status(201).json({
      message: "School assigned to vendor successfully",
      vendor: {
        id: updatedVendor.id,
        email: updatedVendor.email,
        vendorName: updatedVendor.vendorName,
        schoolIds: updatedVendor.schoolIds,
      },
    });
  } catch (error: any) {
    console.error("ASSIGN SCHOOL ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to assign school",
    });
  }
};

/**
 * Remove a school from a vendor
 */
export const removeSchoolFromVendor = async (
  req: AuthRequest,
  res: Response
) => {
  const { vendorId, schoolId } = req.params;

  // RBAC: Only SUPER_ADMIN can remove assignments
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validation
  if (!vendorId || isNaN(Number(vendorId))) {
    return res.status(400).json({ message: "Valid vendorId is required" });
  }

  if (!schoolId || isNaN(Number(schoolId))) {
    return res.status(400).json({ message: "Valid schoolId is required" });
  }

  try {
    const vendor = await prisma.user.findUnique({
      where: { id: Number(vendorId) },
      select: { id: true, schoolIds: true },
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Check if school is assigned
    if (!vendor.schoolIds.includes(Number(schoolId))) {
      return res.status(404).json({
        message: "Vendor is not assigned to this school",
      });
    }

    // Remove school from schoolIds array
    const updatedVendor = await prisma.user.update({
      where: { id: Number(vendorId) },
      data: {
        schoolIds: vendor.schoolIds.filter((id) => id !== Number(schoolId)),
      },
    });

    return res.json({
      message: "School removed from vendor successfully",
      vendor: {
        id: updatedVendor.id,
        email: updatedVendor.email,
        vendorName: updatedVendor.vendorName,
        schoolIds: updatedVendor.schoolIds,
      },
    });
  } catch (error: any) {
    console.error("REMOVE SCHOOL ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to remove school",
    });
  }
};

/**
 * Get all schools assigned to a vendor
 */
export const getVendorSchools = async (
  req: AuthRequest,
  res: Response
) => {
  let { vendorId } = req.params;
  const { limit = "10", page = "1" } = req.query as Record<string, string>;

  // If vendorId not provided, use logged-in vendor's ID
  if (!vendorId) {
    if (req.user?.role !== "VENDOR") {
      return res.status(400).json({ message: "vendorId is required for non-vendor users" });
    }
    vendorId = String(req.user.id);
  }

  // RBAC: SUPER_ADMIN or the vendor themselves
  if (
    req.user?.role !== "SUPER_ADMIN" &&
    req.user?.id !== Number(vendorId)
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!vendorId || isNaN(Number(vendorId))) {
    return res.status(400).json({ message: "Valid vendorId is required" });
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    // Verify vendor exists
    const vendor = await prisma.user.findUnique({
      where: { id: Number(vendorId) },
      select: { id: true, role: true, schoolIds: true, email: true, vendorName: true },
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.role !== "VENDOR") {
      return res.status(400).json({ message: "User is not a vendor" });
    }

    // Get total count of assigned schools
    const total = vendor.schoolIds.length;

    // Get paginated schools
    const paginatedSchoolIds = vendor.schoolIds.slice(skip, skip + limitNum);

    const schools = await prisma.school.findMany({
      where: {
        id: {
          in: paginatedSchoolIds,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        address: true,
        contactNumber: true,
        adminEmail: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    // Add totalStudents to each school
    const schoolsWithStudentCount = schools.map((school: any) => ({
      ...school,
      totalStudents: school._count.students,
      _count: undefined,
    }));

    return res.json({
      data: schoolsWithStudentCount,
      vendorInfo: {
        vendorId: Number(vendorId),
        vendorEmail: vendor.email,
        vendorName: vendor.vendorName,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("GET VENDOR SCHOOLS ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch vendor schools",
    });
  }
};