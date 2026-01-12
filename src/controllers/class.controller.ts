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
 * Get classes (scoped)
 */
export const getClasses = async (req: AuthRequest, res: Response) => {
  const where =
    req.user?.role === "SUPER_ADMIN"
      ? {}
      : { schoolId: req.user?.schoolId! };

  const classes = await prisma.class.findMany({
    where,
    include: { sections: true },
    orderBy:{name:"asc"}
  });

  return res.json(classes);
};
