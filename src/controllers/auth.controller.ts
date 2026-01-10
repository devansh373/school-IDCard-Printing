import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/auth.js";
import type { AuthRequest } from "../middlewares/authenticate.middleware.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.cookie("access_token", token, {
    httpOnly: true, // ✅ prevents JS access
    secure: process.env.NODE_ENVIRONMENT === "local" ? false : true, // ⚠️ true in production (HTTPS)
    sameSite: "strict", // ✅ CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 1 day

  });
 return res.json({
    message: "Login successful",
    user: {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
//   return res.json({ message: "Login successful" });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("access_token");
  return res.json({ message: "Logged out successfully" });
};




export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current and new password are required",
    });
  }

  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isMatch) {
    return res.status(400).json({
      message: "Current password is incorrect",
    });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return res.json({ message: "Password updated successfully" });
};
