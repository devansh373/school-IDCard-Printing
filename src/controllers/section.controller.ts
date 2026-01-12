import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import {prisma} from "../db.js";

/**
 * Create a section
 */
export const createSection = async (req: AuthRequest, res: Response) => {
  const { name, classId } = req.body;

  if (!name || !classId) {
    return res.status(400).json({ message: "name and classId required" });
  }

  const parentClass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!parentClass) {
    return res.status(404).json({ message: "Class not found" });
  }

  // SCHOOL_ADMIN isolation
  if (
    req.user?.role === "SCHOOL_ADMIN" &&
    parentClass.schoolId !== req.user.schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const section = await prisma.section.create({
    data: { name, classId },
  });

  return res.status(201).json(section);
};

/**
 * Get sections (scoped)
 */
export const getSections = async (req: AuthRequest, res: Response) => {
  const where =
    req.user?.role === "SUPER_ADMIN"
      ? {}
      : {
          class: {
            schoolId: req.user?.schoolId!,
          },
        };

  const sections = await prisma.section.findMany({
    where,
    orderBy:{name:"asc"}
  });

  return res.json(sections);
};
