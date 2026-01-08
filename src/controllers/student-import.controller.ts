import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import { processStudentImport } from "../services/student-import.service.js";

export const importStudents = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const result = await processStudentImport({
    file: req.file,
    user: req.user!,
    schoolCode: req.body.schoolCode,
  });

  return res.json(result);
};
