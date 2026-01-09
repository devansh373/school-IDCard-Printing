import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";

import { superAdminDashboard } from "../controllers/dashboard.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.get(
  "/super-admin",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  superAdminDashboard
);

export default router;
