import express from "express";
import schoolRoutes from "./routes/school.routes.js";

const app = express();

app.use(express.json());

app.use("/api/schools", schoolRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

export default app;
