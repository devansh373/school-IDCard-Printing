import type { Request, Response } from "express";
import { prisma } from "../db.js";

/**
 * Create a school
 */
// export const createSchool = async (req: Request, res: Response) => {
//   const { name, code } = req.body;

//   if (!name || !code) {
//     return res.status(400).json({
//       message: "School name and code are required",
//     });
//   }

//   try {
//     const school = await prisma.school.create({
//       data: { name, code },
//     });

//     return res.status(201).json(school);
//   } catch (error: any) {
//     if (error.code === "P2002") {
//       return res.status(409).json({
//         message: "School code already exists",
//       });
//     }

//     return res.status(500).json({
//       message: "Failed to create school"+error.message,
//     });
//   }
// };

/**
 * Get all schools with optional filters
 */
export const getSchools = async (req: Request, res: Response) => {
  const {
    search,
    limit = "10",
    page = "1",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          adminEmail: true,
          description: true,
          address: true,
          contactNumber: true,
          affiliationNumber: true,
          registrationNumber: true,
          registrationDetails: true,
          authoritySignatureUrl: true,
          principalSignatureUrl: true,
          imagekitPublicKey: true,
          imagekitUrlEndpoint: true,
          imagekitFolder: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      }),
      prisma.school.count({ where }),
    ]);

    // Add totalStudents to each school
    const schoolsWithStudentCount = schools.map((school: any) => ({
      ...school,
      totalStudents: school._count.students,
      _count: undefined,
    }));

    return res.json({
      data: schoolsWithStudentCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("GET SCHOOLS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch schools" });
  }
};

/**
 * Get school by ID
 */
export const getSchoolById = async (req: AuthRequest, res: Response) => {
  const { schoolId } = req.params;

  // Validate schoolId is a number
  if (!schoolId || isNaN(Number(schoolId))) {
    return res.status(400).json({ message: "Valid schoolId is required" });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
      select: {
        id: true,
        name: true,
        code: true,
        adminEmail: true,
        description: true,
        address: true,
        contactNumber: true,
        affiliationNumber: true,
        registrationNumber: true,
        registrationDetails: true,
        authoritySignatureUrl: true,
        principalSignatureUrl: true,
        imagekitPublicKey: true,
        imagekitPrivateKey: true,
        imagekitUrlEndpoint: true,
        imagekitFolder: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    const schoolWithStudentCount = {
      ...school,
      totalStudents: (school as any)._count.students,
      _count: undefined,
    };

    return res.json(schoolWithStudentCount);
  } catch (error: any) {
    console.error("GET SCHOOL ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch school",
    });
  }
};

// register school

import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import bcrypt from "bcrypt";

import { generateTempPassword } from "../utils/password.js";
import { sendSchoolAdminCredentials } from "../utils/mailer.js";
import type { Prisma, School } from "../generated/prisma/client.js";
import { imagekit } from "../config/imagekit.js";
import ImageKit from "imagekit";

export const registerSchoolWithAdmin = async (
  req: AuthRequest,
  res: Response
) => {
  const {
    name,
    code,
    adminEmail,
    imagekitPublicKey,
    imagekitPrivateKey,
    imagekitUrlEndpoint,
    imagekitFolder,
  } = req.body;

  if (
    !name ||
    !code ||
    !adminEmail ||
    !imagekitPublicKey ||
    !imagekitPrivateKey ||
    !imagekitUrlEndpoint
  ) {
    return res.status(400).json({
      message:
        "name, code, adminEmail, imagekitPublicKey, imagekitPrivateKey and imagekitUrlEndpoint are required",
    });
  }

  // 🔐 RBAC
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // Duplicate school check
    const existingSchool = await prisma.school.findUnique({
      where: { code },
      select: { id: true },
    });
    if (existingSchool) {
      return res.status(409).json({ message: "School code already exists" });
    }

    // Duplicate admin check
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      return res.status(409).json({ message: "Admin email already exists" });
    }

    const { school, tempPassword } = await prisma.$transaction(
      async (tx): Promise<{ school: School; tempPassword: string }> => {
        const school = await tx.school.create({
          data: {
            name,
            code,
            imagekitPublicKey,
            imagekitPrivateKey, // 🔐 stored, never exposed
            imagekitUrlEndpoint,
            imagekitFolder: imagekitFolder || null,
          },
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

        return { school, tempPassword };
      }
    );

    // 📧 Email AFTER transaction
    sendSchoolAdminCredentials({
      to: adminEmail,
      schoolCode: code,
      password: tempPassword,
    }).catch(console.error);

    return res.status(201).json({
      message: "School created with ImageKit configuration",
      schoolId: school.id,
    });
  } catch (error: any) {
    console.error("REGISTER SCHOOL ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to register school",
    });
  }
};

/**
 * Update ImageKit credentials for a school
 */
export const updateImagekitCredentials = async (
  req: AuthRequest,
  res: Response
) => {
  const { schoolId } = req.params;
  const {
    imagekitPublicKey,
    imagekitPrivateKey,
    imagekitUrlEndpoint,
    imagekitFolder,
  } = req.body;

  // 🔐 RBAC: Only SUPER_ADMIN can update credentials
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validate school exists
  if (!schoolId || isNaN(Number(schoolId))) {
    return res.status(400).json({ message: "Valid schoolId is required" });
  }

  // At least one field required for update
  if (
    !imagekitPublicKey &&
    !imagekitPrivateKey &&
    !imagekitUrlEndpoint &&
    imagekitFolder === undefined
  ) {
    return res.status(400).json({
      message:
        "At least one of imagekitPublicKey, imagekitPrivateKey, imagekitUrlEndpoint, or imagekitFolder is required",
    });
  }

  try {
    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
      select: { id: true },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (imagekitPublicKey) updateData.imagekitPublicKey = imagekitPublicKey;
    if (imagekitPrivateKey) updateData.imagekitPrivateKey = imagekitPrivateKey;
    if (imagekitUrlEndpoint)
      updateData.imagekitUrlEndpoint = imagekitUrlEndpoint;
    if (imagekitFolder !== undefined)
      updateData.imagekitFolder = imagekitFolder || null;

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: Number(schoolId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        imagekitPublicKey: true,
        imagekitUrlEndpoint: true,
        imagekitFolder: true,
        // 🔐 Never expose private key in response
      },
    });

    return res.json({
      message: "ImageKit credentials updated successfully",
      school: updatedSchool,
    });
  } catch (error: any) {
    console.error("UPDATE IMAGEKIT ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to update ImageKit credentials",
    });
  }
};

/**
 * Upload Both or Either Signatures to ImageKit
 * Can upload principal signature, authority signature, or both
 */
export const uploadSignatures = async (req: AuthRequest, res: Response) => {
  const { schoolId } = req.params;

  // Cast files as Express.Multer.File[] or single file
  const files = (req.files as any) || {};
  const principalFile = files.principal?.[0];
  const authorityFile = files.authority?.[0];

  if (!principalFile && !authorityFile) {
    return res.status(400).json({
      message: "At least one signature file required (principal or authority)",
    });
  }

  // 🔐 RBAC: SUPER_ADMIN or SCHOOL_ADMIN (only their own school)
  if (
    req.user?.role === "SCHOOL_ADMIN" &&
    req.user.schoolId !== Number(schoolId)
  ) {
    return res
      .status(403)
      .json({ message: "Forbidden: Can only upload to your own school" });
  }

  if (req.user?.role !== "SUPER_ADMIN" && req.user?.role !== "SCHOOL_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validate school exists
  if (!schoolId || isNaN(Number(schoolId))) {
    return res.status(400).json({ message: "Valid schoolId is required" });
  }

  try {
    // 🔍 Fetch school with ImageKit config and existing signatures
    const school = await prisma.school.findUnique({
      where: { id: Number(schoolId) },
      select: {
        id: true,
        imagekitPublicKey: true,
        imagekitPrivateKey: true,
        imagekitUrlEndpoint: true,
        imagekitFolder: true,
        principalSignatureUrl: true,
        authoritySignatureUrl: true,
      },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // 🚫 Block upload if ImageKit not configured
    if (
      !school.imagekitPublicKey ||
      !school.imagekitPrivateKey ||
      !school.imagekitUrlEndpoint
    ) {
      return res.status(400).json({
        message:
          "Image upload is disabled. Please configure ImageKit credentials for this school.",
      });
    }

    // ✅ Create ImageKit instance (per school)
    const ikInstance = new ImageKit({
      publicKey: school.imagekitPublicKey,
      privateKey: school.imagekitPrivateKey,
      urlEndpoint: school.imagekitUrlEndpoint,
    });

    // 📁 Always use 'signatures' folder (separate from student photos)
    const signatureFolder = `/signatures`;

    // 📤 Upload and replace signatures
    const updateData: any = {};

    if (principalFile) {
      // Delete old principal signature if exists
      if (school.principalSignatureUrl) {
        try {
          await ikInstance.deleteFile(school.principalSignatureUrl);
        } catch (deleteError) {
          console.warn(
            "Failed to delete old principal signature:",
            deleteError
          );
          // Continue with upload even if delete fails
        }
      }

      // Upload new principal signature
      const principalResult = await ikInstance.upload({
        file: principalFile.buffer,
        fileName: `principal_signature_${Date.now()}.png`,
        folder: signatureFolder,
        useUniqueFileName: true,
      });
      updateData.principalSignatureUrl = principalResult.url;
    }

    if (authorityFile) {
      // Delete old authority signature if exists
      if (school.authoritySignatureUrl) {
        try {
          await ikInstance.deleteFile(school.authoritySignatureUrl);
        } catch (deleteError) {
          console.warn(
            "Failed to delete old authority signature:",
            deleteError
          );
          // Continue with upload even if delete fails
        }
      }

      // Upload new authority signature
      const authorityResult = await ikInstance.upload({
        file: authorityFile.buffer,
        fileName: `authority_signature_${Date.now()}.png`,
        folder: signatureFolder,
        useUniqueFileName: true,
      });
      updateData.authoritySignatureUrl = authorityResult.url;
    }

    // 💾 Save URLs in DB
    const updatedSchool = await prisma.school.update({
      where: { id: Number(schoolId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        principalSignatureUrl: true,
        authoritySignatureUrl: true,
      },
    });

    return res.json({
      message: "Signatures uploaded and replaced successfully",
      school: updatedSchool,
    });
  } catch (error: any) {
    console.error("UPLOAD SIGNATURES ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to upload signatures",
    });
  }
};

/**
 * Update school setup (general info, logo, template)
 */
export const schoolSetup = async (req: AuthRequest, res: Response) => {
  const { schoolId } = req.params;
  const {
    name,
    code,
    adminEmail,
    description,
    address,
    contactNumber,
    affiliationNumber,
    registrationNumber,
    registrationDetails,
  } = req.body;

  // 🔐 RBAC: SUPER_ADMIN (uses schoolId from params) or SCHOOL_ADMIN (uses schoolId from token)
  let schoolIdNum: number;

  if (req.user?.role === "SUPER_ADMIN") {
    schoolIdNum = Number(schoolId);
    if (isNaN(schoolIdNum)) {
      return res
        .status(400)
        .json({ message: "Valid schoolId is required for SUPER_ADMIN" });
    }
  } else if (req.user?.role === "SCHOOL_ADMIN") {
    schoolIdNum = req.user.schoolId!;
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // 🔍 Fetch school with ImageKit config
    const school = await prisma.school.findUnique({
      where: { id: schoolIdNum },
      select: {
        id: true,
        imagekitPublicKey: true,
        imagekitPrivateKey: true,
        imagekitUrlEndpoint: true,
        logoUrl: true,
        templateUrl: true,
      },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // 🚫 Block upload if ImageKit not configured (required for logo/template)
    const files = (req.files as any) || {};
    const logoFile = files.logo?.[0];
    const templateFile = files.template?.[0];

    if (
      (logoFile || templateFile) &&
      (!school.imagekitPublicKey ||
        !school.imagekitPrivateKey ||
        !school.imagekitUrlEndpoint)
    ) {
      return res.status(400).json({
        message:
          "Image upload is disabled. Please configure ImageKit credentials for this school.",
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (affiliationNumber !== undefined)
      updateData.affiliationNumber = affiliationNumber;
    if (registrationNumber !== undefined)
      updateData.registrationNumber = registrationNumber;
    if (registrationDetails !== undefined)
      updateData.registrationDetails = registrationDetails;

    if (logoFile || templateFile) {
      const ikInstance = new ImageKit({
        publicKey: school.imagekitPublicKey!,
        privateKey: school.imagekitPrivateKey!,
        urlEndpoint: school.imagekitUrlEndpoint!,
      });

      if (logoFile) {
        // Upload logo
        const logoUpload = await ikInstance.upload({
          file: logoFile.buffer,
          fileName: `logo_${Date.now()}.png`,
          folder: `/logo`,
          useUniqueFileName: true,
        });
        updateData.logoUrl = logoUpload.url;
      }

      if (templateFile) {
        // Upload template
        const templateUpload = await ikInstance.upload({
          file: templateFile.buffer,
          fileName: `template_${Date.now()}.png`,
          folder: `/templates`,
          useUniqueFileName: true,
        });
        updateData.templateUrl = templateUpload.url;
      }
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolIdNum },
      data: updateData,
    });

    return res.json({
      message: "School setup updated successfully",
      school: updatedSchool,
    });
  } catch (error: any) {
    console.error("SCHOOL SETUP ERROR:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "School code already exists" });
    }
    return res.status(500).json({
      message: error.message || "Failed to update school setup",
    });
  }
};
