import express from "express";
import schoolRoutes from "./routes/school.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import classRoutes from "./routes/class.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import studentRoutes from "./routes/student.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import vendorRoutes from "./routes/vendor.routes.js";

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


app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

export default app;
