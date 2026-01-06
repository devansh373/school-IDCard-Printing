import type { Request, Response } from "express";
import {prisma} from "../db.js";

/**
 * Create a school
 */
export const createSchool = async (req: Request, res: Response) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      message: "School name and code are required",
    });
  }

  try {
    const school = await prisma.school.create({
      data: { name, code },
    });

    return res.status(201).json(school);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "School code already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create school"+error.message,
    });
  }
};

/**
 * Get all schools
 */
export const getSchools = async (_req: Request, res: Response) => {
  const schools = await prisma.school.findMany({
    orderBy: { id: "asc" },
  });

  return res.json(schools);
};
