import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import { processStudentImport } from "../services/student-import.service.js";

// export const importStudents = async (req: AuthRequest, res: Response) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "File is required" });
//   }

//   const result = await processStudentImport({
//     file: req.file,
//     user: req.user!,
//     schoolCode: req.body.schoolCode,
//   });

//   return res.json(result);
// };

export const importStudents = async (req: AuthRequest, res: Response) => {
  const { students, schoolCode } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      message: "students array is required",
    });
  }

  const result = await processStudentImport({
    students,
    user: req.user!,
    schoolCode,
  });

  return res.json(result);
};
