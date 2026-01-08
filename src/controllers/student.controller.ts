import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import {prisma} from "../db.js";
import  { PrintStatus } from "../generated/prisma/enums.js";
import { imagekit } from "../config/imagekit.js";

export const getStudents = async (req: AuthRequest, res: Response) => {
  const {
    schoolCode,
    class: className,
    section: sectionName,
    printStatus,
    search,
  } = req.query as Record<string, string>;

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

const students = await prisma.student.findMany({
  where: {
    ...(schoolId && { schoolId }),
    ...(parsedPrintStatus && { printStatus: parsedPrintStatus }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { enrollmentNumber: { contains: search } },
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
});


//   const students = await prisma.student.findMany({
//     where: {
//       ...(schoolId && { schoolId }),
//       ...(printStatus && { printStatus }),
//       ...(search && {
//         OR: [
//           { name: { contains: search, mode: "insensitive" } },
//           { enrollmentNumber: { contains: search } },
//         ],
//       }),
//       ...(className && { class: { name: className } }),
//       ...(sectionName && { section: { name: sectionName } }),
//     },
//     include: {
//       class: true,
//       section: true,
//       school: true,
//     },
//     orderBy: { id: "desc" },
//   });

  return res.json(students);
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





export const uploadStudentPhoto = async (
  req: AuthRequest,
  res: Response
) => {
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

  // RBAC: same school
  if (
    (req.user?.role === "SCHOOL_ADMIN" ||
      req.user?.role === "TEACHER") &&
    student.schoolId !== req.user.schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const uploadResult = await imagekit.upload({
    file: req.file.buffer,
    fileName: `student_${studentId}.jpg`,
    folder: `/students/${student.schoolId}`,
  });

  await prisma.student.update({
    where: { id: studentId },
    data: {
      photoUrl: uploadResult.url,
      photoStatus: "UPLOADED",
    },
  });

  return res.json({
    message: "Photo uploaded successfully",
    photoUrl: uploadResult.url,
  });
};
