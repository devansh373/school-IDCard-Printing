import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import { prisma } from "../db.js";
import { PrintStatus } from "../generated/prisma/enums.js";
import ImageKit from "imagekit";
import { getOrCreateIdCardPreview } from "../services/idCard.service.js";

// import { imagekit } from "../config/imagekit.js";

export const getStudents = async (req: AuthRequest, res: Response) => {
  const {
    schoolCode,
    class: className,
    section: sectionName,
    printStatus,
    search,
    limit = "10",
    page = "1",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
  const skip = (pageNum - 1) * limitNum;

  let schoolId: number | undefined;

  // Resolve schoolCode → schoolId (SUPER_ADMIN only)
  if (schoolCode) {
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
      select: { id: true },
    });

    if (!school) {
      return res.status(404).json({ message: "School not found" });
    }

    schoolId = school.id;
  }

  // RBAC enforcement
  if (req.user?.role === "SCHOOL_ADMIN" || req.user?.role === "TEACHER") {
    schoolId = req.user.schoolId!;
  }

  let parsedPrintStatus: PrintStatus | undefined;

  if (printStatus) {
    if (Object.values(PrintStatus).includes(printStatus as PrintStatus)) {
      parsedPrintStatus = printStatus as PrintStatus;
    } else {
      return res.status(400).json({
        message: `Invalid printStatus: ${printStatus}`,
      });
    }
  }

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: {
          ...(schoolId && { schoolId }),
          ...(parsedPrintStatus && { printStatus: parsedPrintStatus }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } } as any,
              { aparIdOrPan: { contains: search, mode: "insensitive" } } as any,
            ],
          }),
          ...(className && { class: { name: className } }),
          ...(sectionName && { section: { name: sectionName } }),
        },
        include: {
          class: true,
          section: true,
          school: true,
        },
        orderBy: { id: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.student.count({
        where: {
          ...(schoolId && { schoolId }),
          ...(parsedPrintStatus && { printStatus: parsedPrintStatus }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } } as any,
              { aparIdOrPan: { contains: search, mode: "insensitive" } } as any,
            ],
          }),
          ...(className && { class: { name: className } }),
          ...(sectionName && { section: { name: sectionName } }),
        },
      }),
    ]);

    return res.json({
      data: students,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("GET STUDENTS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      section: true,
      school: true,
    },
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // RBAC isolation
  if (
    (req.user?.role === "SCHOOL_ADMIN" || req.user?.role === "TEACHER") &&
    student.schoolId !== req.user.schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(student);
};

/**
 * Create a single student
 */
export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      aparIdOrPan,
      rollNo,
      name,
      dateOfBirth,
      currentAddress,
      guardianMobileNo,
      gender,
      religion,
      bloodGroup,
      className,
      sectionName,
      schoolCode,
    } = req.body;

    // Validate required fields
    if (!aparIdOrPan || !name || !className || !sectionName) {
      return res.status(400).json({
        message:
          "Required fields: aparIdOrPan (APARID/PAN), name, className, sectionName",
      });
    }

    // Resolve schoolId
    let schoolId: number;
    if (req.user?.role === "SCHOOL_ADMIN") {
      schoolId = req.user.schoolId!;
    } else if (req.user?.role === "SUPER_ADMIN") {
      if (!schoolCode) {
        return res.status(400).json({
          message: "schoolCode is required for SUPER_ADMIN",
        });
      }
      const school = await prisma.school.findUnique({
        where: { code: schoolCode },
      });
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      schoolId = school.id;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Find or Create Class
    let schoolClass = await prisma.class.findFirst({
      where: { name: { equals: className, mode: "insensitive" }, schoolId },
    });

    if (!schoolClass) {
      schoolClass = await prisma.class.create({
        data: { name: className, schoolId },
      });
    }

    // Find or Create Section
    let section = await prisma.section.findFirst({
      where: {
        name: { equals: sectionName, mode: "insensitive" },
        classId: schoolClass.id,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: { name: sectionName, classId: schoolClass.id },
      });
    }

    // Check for duplicate APARID/PAN
    const existingStudent = await prisma.student.findUnique({
      where: { aparIdOrPan },
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "Student with this enrollment number already exists",
      });
    }

    // Parse date of birth if provided
    let parsedDateOfBirth: Date | null = null;
    if (dateOfBirth) {
      const parsed = new Date(dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        parsedDateOfBirth = parsed;
      }
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        aparIdOrPan,
        rollNo: rollNo || null,
        name,
        dateOfBirth: parsedDateOfBirth,
        currentAddress: currentAddress || null,
        guardianMobileNo: guardianMobileNo || null,
        gender: gender || null,
        religion: religion || null,
        bloodGroup: bloodGroup || null,
        schoolId,
        classId: schoolClass.id,
        sectionId: section.id,
      },
      include: {
        class: true,
        section: true,
        school: true,
      },
    });

    return res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (err: any) {
    console.error("Create student error:", err);
    return res.status(500).json({
      message: err.message || "Failed to create student",
    });
  }
};

// export const uploadStudentPhoto = async (
//   req: AuthRequest,
//   res: Response
// ) => {
//   const studentId = Number(req.params.id);

//   if (!req.file) {
//     return res.status(400).json({ message: "Image file required" });
//   }

//   const student = await prisma.student.findUnique({
//     where: { id: studentId },
//   });

//   if (!student) {
//     return res.status(404).json({ message: "Student not found" });
//   }

//   // 🔐 RBAC: same school
//   if (
//     req.user?.role === "SCHOOL_ADMIN" &&
//     student.schoolId !== req.user.schoolId
//   ) {
//     return res.status(403).json({ message: "Forbidden" });
//   }

//   // 🔍 Fetch school ImageKit config
//   const school = await prisma.school.findUnique({
//     where: { id: student.schoolId },
//     select: {
//       imagekitPublicKey: true,
//       imagekitPrivateKey: true,
//       imagekitUrlEndpoint: true,
//       imagekitFolder: true,
//     },
//   });

//   // 🚫 Block upload if ImageKit not configured
//   if (
//     !school?.imagekitPublicKey ||
//     !school?.imagekitPrivateKey ||
//     !school?.imagekitUrlEndpoint
//   ) {
//     return res.status(400).json({
//       message:
//         "Image upload is disabled. Please configure ImageKit credentials for this school.",
//     });
//   }

//   // ✅ Create ImageKit instance (per school)
//   const imagekit = new ImageKit({
//     publicKey: school.imagekitPublicKey,
//     privateKey: school.imagekitPrivateKey,
//     urlEndpoint: school.imagekitUrlEndpoint,
//   });

//   // 📁 Folder structure (clean & isolated)
//   const folder =
//     school.imagekitFolder ??
//     `/schools/${student.schoolId}/students`;

//   // 📤 Upload
//   const uploadResult = await imagekit.upload({
//     file: req.file.buffer,
//     fileName: `student_${studentId}.jpg`,
//     folder,
//     useUniqueFileName: true,
//   });

//   // 💾 Save URL in DB
//   await prisma.student.update({
//     where: { id: studentId },
//     data: {
//       photoUrl: uploadResult.url,
//       photoStatus: "UPLOADED",
//     },
//   });

//   return res.json({
//     message: "Photo uploaded successfully",
//     photoUrl: uploadResult.url,
//   });
// };

// export const uploadStudentPhoto = async (
//   req: AuthRequest,
//   res: Response
// ) => {
//   try {
//     const studentId = Number(req.params.id);

//     if (!req.file) {
//       return res.status(400).json({ message: "Image file required" });
//     }

//     const student = await prisma.student.findUnique({
//       where: { id: studentId },
//     });

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     if (
//       req.user?.role === "SCHOOL_ADMIN" &&
//       student.schoolId !== req.user.schoolId
//     ) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     const school = await prisma.school.findUnique({
//       where: { id: student.schoolId },
//       select: {
//         imagekitPublicKey: true,
//         imagekitPrivateKey: true,
//         imagekitUrlEndpoint: true,
//         imagekitFolder: true,
//       },
//     });

//     if (
//       !school?.imagekitPublicKey ||
//       !school?.imagekitPrivateKey ||
//       !school?.imagekitUrlEndpoint
//     ) {
//       return res.status(400).json({
//         message:
//           "Image upload is disabled. Please configure ImageKit credentials for this school.",
//       });
//     }

//     const imagekit = new ImageKit({
//       publicKey: school.imagekitPublicKey,
//       privateKey: school.imagekitPrivateKey,
//       urlEndpoint: school.imagekitUrlEndpoint,
//     });

//     const folder =
//       school.imagekitFolder ??
//       `/schools/${student.schoolId}/students`;

//     const uploadResult = await imagekit.upload({
//       file: req.file.buffer,
//       fileName: `student_${studentId}.jpg`,
//       folder,
//       useUniqueFileName: true,
//     });

//     await prisma.student.update({
//       where: { id: studentId },
//       data: {
//         photoUrl: uploadResult.url,
//         photoStatus: "UPLOADED",
//       },
//     });

//     return res.json({
//       message: "Photo uploaded successfully",
//       photoUrl: uploadResult.url,
//     });
//   } catch (error: any) {
//     console.error("UPLOAD PHOTO ERROR:", error);
//     return res.status(500).json({
//       message: error.message || "Failed to upload student photo",
//     });
//   }
// };

export const uploadStudentPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "Image file required" });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      req.user?.role === "SCHOOL_ADMIN" &&
      student.schoolId !== req.user.schoolId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const school = await prisma.school.findUnique({
      where: { id: student.schoolId },
      select: {
        imagekitPublicKey: true,
        imagekitPrivateKey: true,
        imagekitUrlEndpoint: true,
        imagekitFolder: true,
      },
    });

    if (
      !school?.imagekitPublicKey ||
      !school?.imagekitPrivateKey ||
      !school?.imagekitUrlEndpoint
    ) {
      return res.status(400).json({
        message:
          "Image upload is disabled. Please configure ImageKit credentials for this school.",
      });
    }

    const imagekit = new ImageKit({
      publicKey: school.imagekitPublicKey,
      privateKey: school.imagekitPrivateKey,
      urlEndpoint: school.imagekitUrlEndpoint,
    });

    const folder =
      school.imagekitFolder ?? `/schools/${student.schoolId}/students`;

    const uploadResult = await imagekit.upload({
      file: req.file.buffer,
      fileName: `student_${studentId}.jpg`,
      folder,
      useUniqueFileName: true,
    });

    // ✅ 1️⃣ Save photo
    await prisma.student.update({
      where: { id: studentId },
      data: {
        photoUrl: uploadResult.url,
        photoStatus: "UPLOADED",
      },
    });

    // ✅ 2️⃣ AUTO-GENERATE ID CARD (NON-BLOCKING)
    getOrCreateIdCardPreview(studentId, "FRONT")
      .then(() => getOrCreateIdCardPreview(studentId, "BACK"))
      .then(() => {
        console.log(
          `ID cards (Front & Back) generated for student ${studentId}`,
        );
      })
      .catch((err) => {
        console.error(
          `ID card generation failed for student ${studentId}`,
          err,
        );
      });

    // ✅ 3️⃣ Respond immediately
    return res.json({
      message: "Photo uploaded successfully. ID card generation started.",
      photoUrl: uploadResult.url,
    });
  } catch (error: any) {
    console.error("UPLOAD PHOTO ERROR:", error);
    return res.status(500).json({
      message: error.message || "Failed to upload student photo",
    });
  }
};

/**
 * Update student details
 * Updatable fields: name, aparIdOrPan, dateOfBirth, currentAddress, guardianMobileNo, gender, religion, bloodGroup, classId, sectionId, printStatus, photoStatus
 */
export const updateStudent = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);
  const {
    name,
    aparIdOrPan,
    dateOfBirth,
    currentAddress,
    guardianMobileNo,
    gender,
    religion,
    bloodGroup,
    classId,
    sectionId,
    printStatus,
    photoStatus,
  } = req.body;

  // Validate at least one field to update
  if (
    !name &&
    !aparIdOrPan &&
    !dateOfBirth &&
    !currentAddress &&
    !guardianMobileNo &&
    !gender &&
    !religion &&
    !bloodGroup &&
    !classId &&
    !sectionId &&
    !printStatus &&
    !photoStatus
  ) {
    return res.status(400).json({
      message: "At least one valid field is required for update",
    });
  }

  // Find the student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // RBAC isolation - SCHOOL_ADMIN can only update their school's students
  if (
    req.user?.role === "SCHOOL_ADMIN" &&
    student.schoolId !== req.user.schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validate printStatus if provided
  if (
    printStatus &&
    !Object.values(PrintStatus).includes(printStatus as PrintStatus)
  ) {
    return res.status(400).json({
      message: `Invalid printStatus: ${printStatus}. Valid values: ${Object.values(PrintStatus).join(", ")}`,
    });
  }

  // Validate photoStatus if provided
  if (photoStatus && !["NOT_UPLOADED", "UPLOADED"].includes(photoStatus)) {
    return res.status(400).json({
      message: `Invalid photoStatus: ${photoStatus}. Valid values: NOT_UPLOADED, UPLOADED`,
    });
  }

  // Build update data - only include fields that are provided
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (aparIdOrPan !== undefined) updateData.aparIdOrPan = aparIdOrPan;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (currentAddress !== undefined) updateData.currentAddress = currentAddress;
  if (guardianMobileNo !== undefined)
    updateData.guardianMobileNo = guardianMobileNo;
  if (gender !== undefined) updateData.gender = gender;
  if (religion !== undefined) updateData.religion = religion;
  if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
  if (classId !== undefined) updateData.classId = classId;
  if (sectionId !== undefined) updateData.sectionId = sectionId;
  if (printStatus !== undefined) updateData.printStatus = printStatus;
  if (photoStatus !== undefined) updateData.photoStatus = photoStatus;

  try {
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: {
        class: true,
        section: true,
        school: true,
      },
    });

    return res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error: any) {
    // // Unique constraint violation (e.g., enrollmentNumber)
    // if (error.code === "P2002") {
    //   return res.status(409).json({
    //     message: `${error.meta?.target?.[0] || "Field"} already exists`,
    //   });
    // }
    // // Foreign key constraint (e.g., classId or sectionId not found)
    // if (error.code === "P2025" || error.code === "P2003") {
    //   return res.status(400).json({
    //     message: "Class or Section not found",
    //   });
    // }
    return res.status(500).json({
      message: "Failed to update student",
    });
  }
};

/**
 * Delete student
 */
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.id);

  // Find the student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // RBAC isolation - only SUPER_ADMIN and SCHOOL_ADMIN can delete
  if (req.user?.role === "TEACHER") {
    return res.status(403).json({ message: "Teachers cannot delete students" });
  }

  if (
    req.user?.role === "SCHOOL_ADMIN" &&
    student.schoolId !== req.user.schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    return res.status(200).json({
      message: "Student deleted successfully",
      studentId: studentId,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete student",
    });
  }
};
