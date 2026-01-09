import type { Response } from "express";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";
import { prisma } from "../db.js";

export const superAdminDashboard = async (
  req: AuthRequest,
  res: Response
) => {
  // Extra safety (even though route has authorizeRoles)
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const [totalSchools, activeVendors, recentSchools] =
      await Promise.all([
        // 1️⃣ Total schools
        prisma.school.count(),

        // 2️⃣ Active vendors (from User table)
        prisma.user.count({
          where: {
            role: "VENDOR",
            isActive: true,
          },
        }),

        // 3️⃣ Recently joined schools
        prisma.school.findMany({
          select: {
            id: true,
            name: true,
            code: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        }),
      ]);

    return res.json({
      stats: {
        totalSchools,
        activeVendors,
      },
      recentSchools,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
};
