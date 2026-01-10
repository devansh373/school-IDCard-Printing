import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authenticate.middleware.js";



export const blockIfPasswordChangeRequired = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Safety check (authenticate must run before this)
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 🔴 CORE RULE
  if (req.user.mustChangePassword) {
    return res.status(403).json({
      message: "Password change required",
      code: "403",
    });
  }

  next();
};
