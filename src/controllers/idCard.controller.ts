// // src/controllers/idCard.controller.ts
// import type { Request, Response } from "express";

// import { generateIdCardPreview } from "../services/idCardRenderer.js";
// import { prisma } from "../db.js";

// export const previewIdCard = async (req: Request, res: Response) => {
//   const { studentId } = req.params;

//   const student = await prisma.student.findUnique({
//     where: { id: Number(studentId) },
//     include: {
//       class: true,
//       section: true,
//     },
//   });

//   if (!student || !student.photoUrl) {
//     return res.status(404).json({ message: "Student or photo not found" });
//   }

//   const frontUrl = await generateIdCardPreview({
//     name: student.firstName + " " + student.lastName,
//     className: student.class.name,
//     sectionName: student.section.name,
//     photoUrl: student.photoUrl,
//   });

//   res.json({ frontUrl });
// };

import type { Request, Response } from "express";
import { getOrCreateIdCardPreview } from "../services/idCard.service.js";
import { generateIdCardPdf } from "../services/idCardPdf.service.js";
import { prisma } from "../db.js";

export async function previewIdCard(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.studentId);

    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid studentId" });
    }

    const side = (req.query.side as any) === "BACK" ? "BACK" : "FRONT";
    console.log(side);
    const url = await getOrCreateIdCardPreview(studentId, side);

    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function printIdCards(req: Request, res: Response) {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: "studentIds must be an array" });
    }

    await generateIdCardPdf(req, res);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function bulkGenerateIdCards(req: any, res: any) {
  const { studentIds } = req.body;
  const side = (req.query.side as any) === "BACK" ? "BACK" : "FRONT";

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      message: "studentIds array is required",
    });
  }

  if (studentIds.length > 100) {
    return res.status(400).json({
      message: "Maximum 100 students allowed per request",
    });
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  const errors: { studentId: number; error: string }[] = [];

  /**
   * 🔥 Sequential loop (SAFE)
   * You can optimize later if needed
   */
  for (const studentId of studentIds) {
    try {
      const url = await getOrCreateIdCardPreview(studentId, side);

      if (url) {
        generated++;
      } else {
        skipped++;
      }
    } catch (err: any) {
      failed++;
      errors.push({
        studentId,
        error: err.message || "Unknown error",
      });
    }
  }

  return res.json({
    totalRequested: studentIds.length,
    generated,
    skipped,
    failed,
    errors,
  });
}

// export async function getIdCardPreviews(req: any, res: any) {
//   const {
//     page = 1,
//     limit = 20,
//     search,
//     classId,
//     sectionId,
//     status,
//   } = req.query;

//   const take = Math.min(Number(limit), 50);
//   const skip = (Number(page) - 1) * take;

//   /**
//    * 🔎 WHERE CLAUSE
//    */
//   const where: any = {};

//   // 🔹 class filter
//   if (classId) {
//     where.classId = Number(classId);
//   }

//   // 🔹 section filter
//   if (sectionId) {
//     where.sectionId = Number(sectionId);
//   }

//   // 🔹 search
//   if (search) {
//     where.OR = [
//       { firstName: { contains: search, mode: "insensitive" } },
//       { lastName: { contains: search, mode: "insensitive" } },
//       { enrollmentNumber: { contains: search, mode: "insensitive" } },
//       { rollNo: { contains: search, mode: "insensitive" } },
//     ];
//   }

//   // 🔹 idCard relation filter (IMPORTANT FIX)
//   if (status) {
//     where.idCard = {
//       is: {
//         status,
//       },
//     };
//   } else {
//     // default: only students having id cards
//     where.idCard = {
//       isNot: null,
//     };
//   }

//   /**
//    * 📦 QUERY
//    */
//   const [total, students] = await Promise.all([
//     prisma.student.count({ where }),
//     prisma.student.findMany({
//       where,
//       skip,
//       take,
//       orderBy: { firstName: "asc" },
//       include: {
//         class: true,
//         section: true,
//         idCard: true,
//       },
//     }),
//   ]);

//   /**
//    * 🎯 RESPONSE
//    */
//   const data = students.map((s) => ({
//     studentId: s.id,
//     name: `${s.firstName} ${s.lastName ?? ""}`.trim(),
//     enrollmentNumber: s.enrollmentNumber,
//     rollNo: s.rollNo,
//     class: s.class.name,
//     section: s.section.name,
//     frontUrl: s.idCard?.frontUrl,
//     status: s.idCard?.status,
//   }));

//   return res.json({
//     page: Number(page),
//     limit: take,
//     total,
//     data,
//   });
// }

export async function getIdCardPreviews(req: any, res: any) {
  const {
    page = 1,
    limit = 20,
    search,
    classId,
    sectionId,
    status,
  } = req.query;

  // 🔐 School scoping
  const schoolId =
    req.user?.role === "SUPER_ADMIN" || req.user?.role === "VENDOR"
      ? Number(req.query.schoolId)
      : req.user?.schoolId;
  console.log(schoolId, req.user?.role);

  // if (!schoolId) {
  //   return res.status(400).json({ message: "schoolId is required" });
  // }

  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  /**
   * 🔎 WHERE CLAUSE
   */
  const where: any = {
    schoolId, // ✅ MAIN FIX
  };

  // 🔹 class filter
  if (classId) {
    where.classId = Number(classId);
  }

  // 🔹 section filter
  if (sectionId) {
    where.sectionId = Number(sectionId);
  }

  // 🔹 search
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { aparIdOrPan: { contains: search, mode: "insensitive" } },
      { rollNo: { contains: search, mode: "insensitive" } },
    ];
  }

  // 🔹 idCard relation filter
  if (status) {
    where.idCard = {
      is: {
        status,
      },
    };
  } else {
    // default: only students having id cards
    where.idCard = {
      isNot: null,
    };
  }

  /**
   * 📦 QUERY
   */
  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        class: true,
        section: true,
        idCard: true,
      },
    }),
  ]);

  /**
   * 🎯 RESPONSE
   */
  const data = students.map((s: any) => ({
    studentId: s.id,
    name: s.name,
    aparIdOrPan: s.aparIdOrPan,
    rollNo: s.rollNo,
    class: s.class.name,
    section: s.section.name,
    frontUrl: s.idCard?.frontUrl,
    backUrl: s.idCard?.backUrl,
    status: s.idCard?.status,
  }));

  return res.json({
    page: Number(page),
    limit: take,
    total,
    data,
  });
}
