import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import {prisma} from "../db.js";

/**
 * Create a class
 */
export const createClass = async (req: AuthRequest, res: Response) => {
  const { name, schoolId } = req.body;

  if (!name || !schoolId) {
    return res.status(400).json({ message: "name and schoolId required" });
  }

  // SCHOOL_ADMIN can only create for their own school
  if (
    req.user?.role === "SCHOOL_ADMIN" &&
    req.user.schoolId !== schoolId
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const newClass = await prisma.class.create({
    data: { name, schoolId },
  });

  return res.status(201).json(newClass);
};

/**
 * Get classes (scoped) with optional filters
 */
export const getClasses = async (req: AuthRequest, res: Response) => {
  const { search, limit = "10", page = "1" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: any =
    req.user?.role === "SUPER_ADMIN"
      ? {}
      : { schoolId: req.user?.schoolId! };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  try {
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: { sections: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip,
        take: limitNum,
      }),
      prisma.class.count({ where }),
    ]);

    return res.json({
      data: classes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("GET CLASSES ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch classes" });
  }
};
