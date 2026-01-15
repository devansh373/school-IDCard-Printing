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
 * Get sections (scoped) with optional filters
 */
export const getSections = async (req: AuthRequest, res: Response) => {
  const { search, classId, limit = "10", page = "1" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: any =
    req.user?.role === "SUPER_ADMIN"
      ? {}
      : {
          class: {
            schoolId: req.user?.schoolId!,
          },
        };

  if (classId) {
    where.classId = Number(classId);
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  try {
    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip,
        take: limitNum,
      }),
      prisma.section.count({ where }),
    ]);

    return res.json({
      data: sections,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("GET SECTIONS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch sections" });
  }
};

