import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import {prisma} from "../db.js";
import  { PrintStatus } from "../generated/prisma/enums.js";
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
              { firstName: { contains: search, mode: "insensitive" } } as any,
              { lastName: { contains: search, mode: "insensitive" } } as any,
              { enrollmentNumber: { contains: search } } as any,
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
              { firstName: { contains: search, mode: "insensitive" } } as any,
              { lastName: { contains: search, mode: "insensitive" } } as any,
              { enrollmentNumber: { contains: search } } as any,
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
    (req.user?.role === "SCHOOL_ADMIN" ||
      req.user?.role === "TEACHER") &&
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
      enrollmentNumber,
      rollNo,
      admissionNo,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      fatherName,
      motherName,
      currentAddress,
      remarks,
      mobileNo,
      email,
      gender,
      religion,
      aadhar,
      aparId,
      uniqueId,
      pan,
      bloodGroup,
      houseName,
      classId,
      sectionId,
      schoolCode,
    } = req.body;

    // Validate required fields
    if (!enrollmentNumber || !firstName || !classId || !sectionId) {
      return res.status(400).json({
        message: "Required fields: enrollmentNumber, firstName, classId, sectionId",
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

    // Verify class and section exist in the school
    const classExists = await prisma.class.findFirst({
      where: { id: Number(classId), schoolId },
    });

    if (!classExists) {
      return res.status(404).json({ message: "Class not found in this school" });
    }

    const sectionExists = await prisma.section.findFirst({
      where: { id: Number(sectionId), classId: Number(classId) },
    });

    if (!sectionExists) {
      return res.status(404).json({ message: "Section not found in this class" });
    }

    // Check for duplicate enrollment number
    const existingStudent = await prisma.student.findUnique({
      where: { enrollmentNumber },
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
        enrollmentNumber,
        rollNo: rollNo || null,
        admissionNo: admissionNo || null,
        firstName,
        middleName: middleName || null,
        lastName: lastName || null,
        dateOfBirth: parsedDateOfBirth,
        fatherName: fatherName || null,
        motherName: motherName || null,
        currentAddress: currentAddress || null,
        remarks: remarks || null,
        mobileNo: mobileNo || null,
        email: email || null,
        gender: gender || null,
        religion: religion || null,
        aadhar: aadhar || null,
        aparId: aparId || null,
        uniqueId: uniqueId || null,
        pan: pan || null,
        bloodGroup: bloodGroup || null,
        houseName: houseName || null,
        schoolId,
        classId: Number(classId),
        sectionId: Number(sectionId),
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

export const uploadStudentPhoto = async (
  req: AuthRequest,
  res: Response
) => {
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
      school.imagekitFolder ??
      `/schools/${student.schoolId}/students`;

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
    getOrCreateIdCardPreview(studentId)
      .then(() => {
        console.log(`ID card generated for student ${studentId}`);
      })
      .catch((err) => {
        console.error(
          `ID card generation failed for student ${studentId}`,
          err
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
 * Updatable fields: name, enrollmentNumber, fatherName, phoneNumber, email, classId, sectionId, printStatus, photoStatus
 */
export const updateStudent = async (
  req: AuthRequest,
  res: Response
) => {
  const studentId = Number(req.params.id);
  const {
    name,
    enrollmentNumber,
    fatherName,
    phoneNumber,
    email,
    classId,
    sectionId,
    printStatus,
    photoStatus,
  } = req.body;

  // Validate at least one field to update
  if (
    !name &&
    !enrollmentNumber &&
    !fatherName &&
    !phoneNumber &&
    !email &&
    !classId &&
    !sectionId &&
    !printStatus &&
    !photoStatus
  ) {
    return res.status(400).json({
      message:
        "At least one field (name, enrollmentNumber, fatherName, phoneNumber, email, classId, sectionId, printStatus, photoStatus) is required",
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
  if (printStatus && !Object.values(PrintStatus).includes(printStatus as PrintStatus)) {
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
  if (enrollmentNumber !== undefined) updateData.enrollmentNumber = enrollmentNumber;
  if (fatherName !== undefined) updateData.fatherName = fatherName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (email !== undefined) updateData.email = email;
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
export const deleteStudent = async (
  req: AuthRequest,
  res: Response
) => {
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
