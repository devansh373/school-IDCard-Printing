import express from "express";

import type { Request, Response, NextFunction } from "express";
import multer from "multer";


import schoolRoutes from "./routes/school.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import classRoutes from "./routes/class.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import studentRoutes from "./routes/student.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import vendorRoutes from "./routes/vendor.routes.js";
// import idCardRoutes from "./routes/idCard.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/schools", schoolRoutes);

app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/vendors", vendorRoutes);
// app.use("/api", idCardRoutes);

app.use((err:any, req:Request, res:Response, next:NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message?.includes("image")) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

export default app;
