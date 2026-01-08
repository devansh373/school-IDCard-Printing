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


import Papa from "papaparse";
import * as XLSX from "xlsx";
import {prisma} from "../db.js";

interface ImportArgs {
  file: Express.Multer.File;
  user: {
    role: string;
    schoolId?: number;
  };
  schoolCode?: string;
}

interface ParsedRow {
  enrollmentNumber: string;
  name: string;
  class: string;
  section: string;
}

export const processStudentImport = async ({
  file,
  user,
  schoolCode,
}: ImportArgs) => {
  /* ---------------- Resolve school ---------------- */
  let schoolId: number;

  if (user.role === "SCHOOL_ADMIN") {
    schoolId = user.schoolId!;
  } else {
    if (!schoolCode) {
      throw new Error("schoolCode required for SUPER_ADMIN");
    }

    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      throw new Error("Invalid schoolCode");
    }

    schoolId = school.id;
  }

  /* ---------------- Parse file ---------------- */
  const rows = parseFile(file) as ParsedRow[];

  /* ---------------- Load classes + sections ---------------- */
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: { sections: true },
  });

  const classMap = new Map(
    classes.map((cls) => [cls.name, cls])
  );

  /* ---------------- Validate rows ---------------- */
  const validStudents: any[] = [];
  const errors: { row: number; reason: string }[] = [];

  rows.forEach((row, index) => {
    try {
      if (
        !row.enrollmentNumber ||
        !row.name ||
        !row.class ||
        !row.section
      ) {
        throw new Error("Missing required fields");
      }

      const cls = classMap.get(row.class);
      if (!cls) throw new Error(`Class '${row.class}' not found`);

      const section = cls.sections.find(
        (s) => s.name === row.section
      );
      if (!section)
        throw new Error(
          `Section '${row.section}' not found in class '${row.class}'`
        );

      validStudents.push({
        enrollmentNumber: row.enrollmentNumber,
        name: row.name,
        schoolId,
        classId: cls.id,
        sectionId: section.id,
      });
    } catch (err: any) {
      errors.push({
        row: index + 2, // +1 header +1 zero-index
        reason: err.message,
      });
    }
  });

  /* ---------------- Bulk insert ---------------- */
  if (validStudents.length > 0) {
    try {
      await prisma.student.createMany({
        data: validStudents,
        skipDuplicates: true, // handles duplicate enrollmentNumber
      });
    } catch (err) {
      throw new Error("Failed to insert students");
    }
  }

  return {
    total: rows.length,
    inserted: validStudents.length - errors.length,
    skipped: errors.length,
    errors,
  };
};



const parseFile = (file: Express.Multer.File) => {
  const ext = file.originalname.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const parsed = Papa.parse(file.buffer.toString("utf-8"), {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data as any[];
  }

  if (ext === "xlsx") {
    const workbook = XLSX.read(file.buffer);

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel file has no sheets");
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error("Unable to read Excel sheet");
    }

    return XLSX.utils.sheet_to_json(sheet);
  }

  throw new Error("Unsupported file type");
};
