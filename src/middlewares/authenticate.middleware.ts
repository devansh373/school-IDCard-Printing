// import type { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "../config/auth.js";

// export interface AuthRequest extends Request {
//   user?: {
//     userId: number;
//     role: string;
//     schoolId?: number;
//   };
// }

// export const authenticate = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const token =
//     req.cookies?.access_token ||
//     req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Authentication required" });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
//     req.user = decoded!;
//     next();
//   } catch {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

import type {Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import type { User } from "../generated/prisma/client.js";


const JWT_SECRET = process.env.JWT_SECRET!;
export interface AuthRequest extends Request {
  user?: User
  // user?: {
  //   id?:number;
  //   userId?: number;
  //   role: string;
  //   schoolId?: number;
  // };
}
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
    };

    // 🔑 ALWAYS fetch fresh user from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ req.user now has mustChangePassword
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
