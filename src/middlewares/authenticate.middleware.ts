import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/auth.js";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    schoolId?: number;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded!;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
