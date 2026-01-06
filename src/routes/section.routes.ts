import { Router } from "express";
import { createSection, getSections } from "../controllers/section.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  createSection
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"),
  getSections
);

export default router;
