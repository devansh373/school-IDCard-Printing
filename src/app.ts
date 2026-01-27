import express from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import schoolRoutes from "./routes/school.routes.js";
import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import studentRoutes from "./routes/student.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import idCardRoutes from "./routes/idCard.routes.js";
import { prisma } from "./db.js";

const app = express();

// Security: Helmet - Set security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Security: CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"]; // Default for development

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security: Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: true,
});

app.use("/api/", generalLimiter);
app.use("/api/auth/login", authLimiter);

// Security: Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api", idCardRoutes);

// Error handling: Multer errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes("image")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  next(err);
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);

  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal server error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

// Health check with database connectivity
app.get("/health", async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
});

export default app;
