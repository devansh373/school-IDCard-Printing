import type { Request, Response } from "express";
import {prisma} from "../db.js";

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
 * Get all schools
 */
export const getSchools = async (_req: Request, res: Response) => {
  const schools = await prisma.school.findMany({
    orderBy: { id: "asc" },
    include: {
      users: {
        where: { role: "SCHOOL_ADMIN" },
        select: { email: true },
        take: 1,
      },
    },
  });

  // Transform to flatten adminEmail
  const enrichedSchools = schools.map((school) => ({
    id: school.id,
    name: school.name,
    code: school.code,
    adminEmail: school.users[0]?.email || null,
    imagekitPublicKey: school.imagekitPublicKey,
    imagekitPrivateKey: school.imagekitPrivateKey, 
    imagekitUrlEndpoint: school.imagekitUrlEndpoint,
    imagekitFolder: school.imagekitFolder,
    createdAt: school.createdAt,
  }));

  return res.json(enrichedSchools);
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
      include: {
        users: {
          where: { role: "SCHOOL_ADMIN" },
          select: { email: true },
          take: 1,
        },
      },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    // Transform to flatten adminEmail
    const enrichedSchool = {
      id: school.id,
      name: school.name,
      code: school.code,
      adminEmail: school.users[0]?.email || null,
      imagekitPublicKey: school.imagekitPublicKey,
      imagekitUrlEndpoint: school.imagekitUrlEndpoint,
      imagekitFolder: school.imagekitFolder,
      // 🔐 Never expose private key
      createdAt: school.createdAt,
    };

    return res.json(enrichedSchool);
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

// export const registerSchoolWithAdmin = async (
//   req: AuthRequest,
//   res: Response
// ) => {
//   const { name, code, adminEmail } = req.body as {
//     name?: string;
//     code?: string;
//     adminEmail?: string;
//   };

//   if (!name || !code || !adminEmail) {
//     return res.status(400).json({
//       message: "name, code and adminEmail are required",
//     });
//   }

//   // RBAC
//   if (req.user?.role !== "SUPER_ADMIN") {
//     return res.status(403).json({ message: "Forbidden" });
//   }

//   try {
//     // Check duplicates early
//     const existingSchool = await prisma.school.findUnique({
//       where: { code },
//       select: { id: true },
//     });
//     if (existingSchool) {
//       return res.status(409).json({ message: "School code already exists" });
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { email: adminEmail },
//       select: { id: true },
//     });
//     if (existingUser) {
//       return res.status(409).json({ message: "Admin email already exists" });
//     }

//     // Transaction keeps data consistent
//     const result = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
//       const school = await tx.school.create({
//         data: { name, code },
//       });

//       const tempPassword = generateTempPassword(10);
//       const passwordHash = await bcrypt.hash(tempPassword, 10);

//       await tx.user.create({
//         data: {
//           email: adminEmail,
//           passwordHash,
//           role: "SCHOOL_ADMIN",
//           schoolId: school.id,
//         },
//       });

//       // Send email AFTER DB success
//       await sendSchoolAdminCredentials({
//         to: adminEmail,
//         schoolCode: code,
//         password: tempPassword,
//       });

//       return school;
//     });

//     return res.status(201).json({
//       message: "School created and admin credentials sent via email",
//       schoolId: result.id,
//     });
//   } catch (error: any) {
//     // Prisma unique constraint
//     if (error.code === "P2002") {
//       return res.status(409).json({ message: "Duplicate entry detected" });
//     }
//     return res.status(500).json({
//       message: "Failed to register school",
//     });
//   }
// };

// export const registerSchoolWithAdmin = async (
//   req: AuthRequest,
//   res: Response
// ) => {
//   const { name, code, adminEmail } = req.body;

//   if (!name || !code || !adminEmail) {
//     return res.status(400).json({
//       message: "name, code and adminEmail are required",
//     });
//   }

//   if (req.user?.role !== "SUPER_ADMIN") {
//     return res.status(403).json({ message: "Forbidden" });
//   }

//   try {
//     const existingSchool = await prisma.school.findUnique({
//       where: { code },
//       select: { id: true },
//     });
//     if (existingSchool) {
//       return res.status(409).json({ message: "School code already exists" });
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { email: adminEmail },
//       select: { id: true },
//     });
//     if (existingUser) {
//       return res.status(409).json({ message: "Admin email already exists" });
//     }

//     const { school, tempPassword } = await prisma.$transaction(async (tx:Prisma.TransactionClient): Promise<{ school: School; tempPassword: string }> => {
//       const school = await tx.school.create({
//         data: { name, code },
//       });

//       const tempPassword = generateTempPassword(10);
//       const passwordHash = await bcrypt.hash(tempPassword, 10);

//       await tx.user.create({
//         data: {
//           email: adminEmail,
//           passwordHash,
//           role: "SCHOOL_ADMIN",
//           schoolId: school.id,
//         },
//       });

//       return { school, tempPassword };
//     });

//     // ✅ Email outside transaction
//     sendSchoolAdminCredentials({
//       to: adminEmail,
//       schoolCode: code,
//       password: tempPassword,
//     }).catch(console.error);

//     return res.status(201).json({
//       message: "School created and admin email queued",
//       schoolId: school.id,
//     });
//   } catch (error: any) {
//     console.error("REGISTER SCHOOL ERROR:", error);
//     return res.status(500).json({
//       message: error.message || "Failed to register school",
//     });
//   }
// };


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
    if (imagekitUrlEndpoint) updateData.imagekitUrlEndpoint = imagekitUrlEndpoint;
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
