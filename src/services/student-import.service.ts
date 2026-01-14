// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import {prisma} from "../db.js";

// interface ImportArgs {
//   file: Express.Multer.File;
//   user: {
//     role: string;
//     schoolId?: number;
//   };
//   schoolCode?: string;
// }

// export const processStudentImport = async ({
//   file,
//   user,
//   schoolCode,
// }: ImportArgs) => {
//   // 1️⃣ Resolve schoolId
//   let schoolId: number;

//   if (user.role === "SCHOOL_ADMIN") {
//     schoolId = user.schoolId!;
//   } else {
//     if (!schoolCode) {
//       throw new Error("schoolCode required for SUPER_ADMIN");
//     }

//     const school = await prisma.school.findUnique({
//       where: { code: schoolCode },
//     });

//     if (!school) {
//       throw new Error("Invalid schoolCode");
//     }

//     schoolId = school.id;
//   }

//   // 2️⃣ Parse file
//   const rows = parseFile(file);

//   // 3️⃣ Preload classes & sections
//   const classes = await prisma.class.findMany({
//     where: { schoolId },
//     include: { sections: true },
//   });

//   const classMap = new Map(
//     classes.map(cls => [cls.name, cls])
//   );

//   let inserted = 0;
//   const errors: any[] = [];

//   // 4️⃣ Insert students safely
//   for (let i = 0; i < rows.length; i++) {
//     const row = rows[i];

//     try {
//       const cls = classMap.get(row.class);
//       if (!cls) throw new Error("Class not found");

//       const section = cls.sections.find(s => s.name === row.section);
//       if (!section) throw new Error("Section not found");

//       await prisma.student.create({
//         data: {
//           enrollmentNumber: row.enrollmentNumber,
//           name: row.name,
//           schoolId,
//           classId: cls.id,
//           sectionId: section.id,
//         },
//       });

//       inserted++;
//     } catch (err: any) {
//       errors.push({
//         row: i + 2, // + header
//         reason: err.message,
//       });
//     }
//   }

//   return {
//     total: rows.length,
//     inserted,
//     skipped: errors.length,
//     errors,
//   };
// };

// import Papa from "papaparse";
// import * as XLSX from "xlsx";
// import {prisma} from "../db.js";
// import type { Prisma, User } from "../generated/prisma/client.js";

// interface ImportArgs {
//   file: Express.Multer.File;
//   user: User
//   schoolCode?: string;
// }

// interface ParsedRow {
//   enrollmentNumber: string;
//   name: string;
//   class: string;
//   section: string;
// }

// export const processStudentImport = async ({
//   file,
//   user,
//   schoolCode,
// }: ImportArgs) => {
//   /* ---------------- Resolve school ---------------- */
//   let schoolId: number;

//   if (user.role === "SCHOOL_ADMIN") {
//      if (!user.schoolId) {
//     throw new Error("School admin is not linked to any school");
//   }
//     schoolId = user.schoolId!;
//   } else {
//     if (!schoolCode) {
//       throw new Error("schoolCode required for SUPER_ADMIN");
//     }

//     const school = await prisma.school.findUnique({
//       where: { code: schoolCode },
//     });

//     if (!school) {
//       throw new Error("Invalid schoolCode");
//     }

//     schoolId = school.id;
//   }

//   /* ---------------- Parse file ---------------- */
//   const rows = parseFile(file) as ParsedRow[];

//   /* ---------------- Load classes + sections ---------------- */
//   const classes = await prisma.class.findMany({
//     where: { schoolId },
//     include: { sections: true },
//   }) satisfies Prisma.ClassGetPayload<{
//   include: { sections: true };
// }>[];

//   const classMap = new Map(
//     classes.map((cls) => [cls.name, cls])
//   );

//   /* ---------------- Validate rows ---------------- */
//   const validStudents: any[] = [];
//   const errors: { row: number; reason: string }[] = [];

//   rows.forEach((row, index) => {
//     try {
//       if (
//         !row.enrollmentNumber ||
//         !row.name ||
//         !row.class ||
//         !row.section
//       ) {
//         throw new Error("Missing required fields");
//       }

//       const cls = classMap.get(row.class);
//       if (!cls) throw new Error(`Class '${row.class}' not found`);

//       const section = cls.sections.find(
//         (s:{ id: number; name: string }) => s.name === row.section
//       );
//       if (!section)
//         throw new Error(
//           `Section '${row.section}' not found in class '${row.class}'`
//         );

//       validStudents.push({
//         enrollmentNumber: row.enrollmentNumber,
//         name: row.name,
//         schoolId,
//         classId: cls.id,
//         sectionId: section.id,
//       });
//     } catch (err: any) {
//       errors.push({
//         row: index + 2, // +1 header +1 zero-index
//         reason: err.message,
//       });
//     }
//   });

//   /* ---------------- Bulk insert ---------------- */
//   if (validStudents.length > 0) {
//     try {
//       await prisma.student.createMany({
//         data: validStudents,
//         skipDuplicates: true, // handles duplicate enrollmentNumber
//       });
//     } catch (err) {
//       throw new Error("Failed to insert students");
//     }
//   }

//   return {
//     total: rows.length,
//     inserted: validStudents.length - errors.length,
//     skipped: errors.length,
//     errors,
//   };
// };

// const parseFile = (file: Express.Multer.File) => {
//   const ext = file.originalname.split(".").pop()?.toLowerCase();

//   if (ext === "csv") {
//     const parsed = Papa.parse(file.buffer.toString("utf-8"), {
//       header: true,
//       skipEmptyLines: true,
//     });

//     return parsed.data as any[];
//   }

//   if (ext === "xlsx") {
//     const workbook = XLSX.read(file.buffer);

//     const sheetName = workbook.SheetNames[0];
//     if (!sheetName) {
//       throw new Error("Excel file has no sheets");
//     }

//     const sheet = workbook.Sheets[sheetName];
//     if (!sheet) {
//       throw new Error("Unable to read Excel sheet");
//     }

//     return XLSX.utils.sheet_to_json(sheet);
//   }

//   throw new Error("Unsupported file type");
// };

// import { prisma } from "../db.js";
// import type { User } from "../generated/prisma/client.js";

// interface StudentInput {
//   enrollmentNumber: string;
//   name: string;
//   class: string;
//   section: string;

//   fatherName?: string;
//   phoneNumber?: string;
//   email?: string;
// }

// interface ImportArgs {
//   students: StudentInput[];
//   user: User;
//   schoolCode?: string;
// }

// export const processStudentImport = async ({
//   students,
//   user,
//   schoolCode,
// }: ImportArgs) => {
//   /* ---------- Resolve school ---------- */
//   let schoolId: number;

//   if (user.role === "SCHOOL_ADMIN") {
//     if (!user.schoolId) {
//       throw new Error("School admin not linked to any school");
//     }
//     schoolId = user.schoolId;
//   } else {
//     if (!schoolCode) {
//       throw new Error("schoolCode required for SUPER_ADMIN");
//     }

//     const school = await prisma.school.findUnique({
//       where: { code: schoolCode },
//     });

//     if (!school) throw new Error("Invalid schoolCode");
//     schoolId = school.id;
//   }

//   /* ---------- Load existing classes ---------- */
//   const classes = await prisma.class.findMany({
//     where: { schoolId },
//     include: { sections: true },
//   });

//   const classMap = new Map(classes.map((c) => [c.name, c]));

//   const studentsToInsert: any[] = [];
//   const errors: { row: number; reason: string }[] = [];

//   for (let i = 0; i < students.length; i++) {
//     const row = students[i];

//     try {
//       if (
//         !row ||
//         !row.enrollmentNumber ||
//         !row.name ||
//         !row.class ||
//         !row.section
//       ) {
//         throw new Error("Missing required fields");
//       }

//       /* ----- Ensure class ----- */
//       let cls = classMap.get(row.class);
//       if (!cls) {
//         cls = await prisma.class.create({
//           data: {
//             name: row.class,
//             schoolId,
//           },
//           include: { sections: true },
//         });
//         classMap.set(row.class, cls);
//       }

//       /* ----- Ensure section ----- */
//       let section = cls.sections.find((s) => s.name === row.section);
//       if (!section) {
//         section = await prisma.section.create({
//           data: {
//             name: row.section,
//             classId: cls.id,
//           },
//         });
//         cls.sections.push(section);
//       }

//       studentsToInsert.push({
//         enrollmentNumber: row.enrollmentNumber,
//         name: row.name,
//         fatherName: row.fatherName ?? null,
//         phoneNumber: row.phoneNumber ?? null,
//         email: row.email ?? null,
//         schoolId,
//         classId: cls.id,
//         sectionId: section.id,
//       });
//     } catch (err: any) {
//       errors.push({
//         row: i + 1,
//         reason: err.message,
//       });
//     }
//   }

//   /* ---------- Bulk insert students ---------- */
//   if (studentsToInsert.length) {
//     await prisma.student.createMany({
//       data: studentsToInsert,
//       skipDuplicates: true,
//     });
//   }

//   return {
//     total: students.length,
//     inserted: studentsToInsert.length - errors.length,
//     skipped: errors.length,
//     errors,
//   };
// };


import { prisma } from "../db.js";
import type { User } from "../generated/prisma/client.js";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface StudentInput {
  enrollmentNumber: string;
  rollNo?: string;
  admissionNo?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  currentAddress?: string;
  remarks?: string;
  mobileNo?: string;
  email?: string;
  gender?: string;
  religion?: string;
  aadhar?: string;
  aparId?: string;
  uniqueId?: string;
  pan?: string;
  bloodGroup?: string;
  houseName?: string;
  class: string;
  section: string;
}

interface ImportArgs {
  file: Express.Multer.File;
  user: User;
  schoolCode?: string;
}

export const processStudentImport = async ({
  file,
  user,
  schoolCode,
}: ImportArgs) => {
  /* ---------- Resolve school ---------- */
  let schoolId: number;

  if (user.role === "SCHOOL_ADMIN") {
    if (!user.schoolId) {
      throw new Error("School admin not linked to any school");
    }
    schoolId = user.schoolId;
  } else {
    if (!schoolCode) {
      throw new Error("schoolCode required for SUPER_ADMIN");
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) throw new Error("Invalid schoolCode");
    schoolId = school.id;
  }

  /* ---------- Parse file (CSV or Excel) ---------- */
  const rows = parseFile(file) as StudentInput[];

  if (!rows || rows.length === 0) {
    throw new Error("File is empty or could not be parsed");
  }

  /* ---------- Load existing classes + sections ---------- */
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: { sections: true },
  });

  const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c]));

  /* ---------- Detect existing students ---------- */
  const enrollmentNumbers = rows
    .map((s) => s.enrollmentNumber)
    .filter(Boolean);

  const existingStudents = await prisma.student.findMany({
    where: {
      enrollmentNumber: { in: enrollmentNumbers },
      schoolId,
    },
    select: { enrollmentNumber: true },
  });

  const existingSet = new Set(existingStudents.map((s) => s.enrollmentNumber));

  /* ---------- Prepare results ---------- */
  const studentsToInsert: any[] = [];
  const errors: { row: number; reason: string }[] = [];
  let duplicateCount = 0;

  /* ---------- Process rows ---------- */
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      if (!row || !row.enrollmentNumber || !row.firstName || !row.class || !row.section) {
        throw new Error("Missing required fields: enrollmentNumber, firstName, class, section");
      }

      /* ----- Duplicate check ----- */
      if (existingSet.has(row.enrollmentNumber)) {
        duplicateCount++;
        continue;
      }

      /* ----- Ensure class (case-insensitive) ----- */
      const classKeyLower = row.class.toLowerCase();
      let cls = classMap.get(classKeyLower);
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            name: row.class,
            schoolId,
          },
          include: { sections: true },
        });
        classMap.set(classKeyLower, cls);
      }

      /* ----- Ensure section ----- */
      let section = cls.sections.find(
        (s) => s.name.toLowerCase() === row.section.toLowerCase()
      );
      if (!section) {
        section = await prisma.section.create({
          data: {
            name: row.section,
            classId: cls.id,
          },
        });
        cls.sections.push(section);
      }

      /* ----- Parse date of birth ----- */
      let dateOfBirth: Date | null = null;
      if (row.dateOfBirth) {
        const parsed = new Date(row.dateOfBirth);
        if (!isNaN(parsed.getTime())) {
          dateOfBirth = parsed;
        }
      }

      /* ----- Prepare insert with all fields ----- */
      studentsToInsert.push({
        enrollmentNumber: row.enrollmentNumber,
        rollNo: row.rollNo || null,
        admissionNo: row.admissionNo || null,
        firstName: row.firstName,
        middleName: row.middleName || null,
        lastName: row.lastName || null,
        dateOfBirth: dateOfBirth,
        fatherName: row.fatherName || null,
        motherName: row.motherName || null,
        currentAddress: row.currentAddress || null,
        remarks: row.remarks || null,
        mobileNo: row.mobileNo || null,
        email: row.email || null,
        gender: row.gender || null,
        religion: row.religion || null,
        aadhar: row.aadhar || null,
        aparId: row.aparId || null,
        uniqueId: row.uniqueId || null,
        pan: row.pan || null,
        bloodGroup: row.bloodGroup || null,
        houseName: row.houseName || null,
        schoolId,
        classId: cls.id,
        sectionId: section.id,
      });
    } catch (err: any) {
      errors.push({
        row: i + 2, // +1 for header, +1 for zero-index
        reason: err.message,
      });
    }
  }

  /* ---------- Bulk insert ---------- */
  if (studentsToInsert.length > 0) {
    await prisma.student.createMany({
      data: studentsToInsert,
      skipDuplicates: true,
    });
  }

  /* ---------- Return response ---------- */
  return {
    total: rows.length,
    inserted: studentsToInsert.length,
    duplicates: duplicateCount,
    skipped: duplicateCount + errors.length,
    errors,
  };
};

const parseFile = (file: Express.Multer.File): StudentInput[] => {
  const ext = file.originalname.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const csvText = file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors && parsed.errors.length > 0) {
      throw new Error(`CSV Parse Error: ${parsed.errors[0]?.message || "Unknown error"}`);
    }

    return (parsed.data as unknown[]).map((row: any) => ({
      enrollmentNumber: row.enrollmentNumber?.trim(),
      rollNo: row.rollNo?.trim(),
      admissionNo: row.admissionNo?.trim(),
      firstName: row.firstName?.trim(),
      middleName: row.middleName?.trim(),
      lastName: row.lastName?.trim(),
      dateOfBirth: row.dateOfBirth?.trim(),
      fatherName: row.fatherName?.trim(),
      motherName: row.motherName?.trim(),
      currentAddress: row.currentAddress?.trim(),
      remarks: row.remarks?.trim(),
      mobileNo: row.mobileNo?.trim(),
      email: row.email?.trim(),
      gender: row.gender?.trim(),
      religion: row.religion?.trim(),
      aadhar: row.aadhar?.trim(),
      aparId: row.aparId?.trim(),
      uniqueId: row.uniqueId?.trim(),
      pan: row.pan?.trim(),
      bloodGroup: row.bloodGroup?.trim(),
      houseName: row.houseName?.trim(),
      class: row.class?.trim(),
      section: row.section?.trim(),
    }));
  }

  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("Excel file has no sheets");
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error("Unable to read Excel sheet");
    }

    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

    return rows.map((row) => ({
      enrollmentNumber: row.enrollmentNumber?.toString().trim(),
      rollNo: row.rollNo?.toString().trim(),
      admissionNo: row.admissionNo?.toString().trim(),
      firstName: row.firstName?.toString().trim(),
      middleName: row.middleName?.toString().trim(),
      lastName: row.lastName?.toString().trim(),
      dateOfBirth: row.dateOfBirth?.toString().trim(),
      fatherName: row.fatherName?.toString().trim(),
      motherName: row.motherName?.toString().trim(),
      currentAddress: row.currentAddress?.toString().trim(),
      remarks: row.remarks?.toString().trim(),
      mobileNo: row.mobileNo?.toString().trim(),
      email: row.email?.toString().trim(),
      gender: row.gender?.toString().trim(),
      religion: row.religion?.toString().trim(),
      aadhar: row.aadhar?.toString().trim(),
      aparId: row.aparId?.toString().trim(),
      uniqueId: row.uniqueId?.toString().trim(),
      pan: row.pan?.toString().trim(),
      bloodGroup: row.bloodGroup?.toString().trim(),
      houseName: row.houseName?.toString().trim(),
      class: row.class?.toString().trim(),
      section: row.section?.toString().trim(),
    }));
  }

  throw new Error("Unsupported file type. Only CSV and Excel (.xlsx, .xls) are supported");
};
