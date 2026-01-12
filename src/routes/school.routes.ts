import { Router } from "express";
import {  getSchools, getSchoolById, registerSchoolWithAdmin, updateImagekitCredentials } from "../controllers/school.controllers.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

// router.post("/", authenticate,authorizeRoles("SUPER_ADMIN"), createSchool);
router.get("/", authenticate,authorizeRoles("SUPER_ADMIN"), getSchools);
router.get("/:schoolId", authenticate, authorizeRoles("SUPER_ADMIN"), getSchoolById);
router.post(
  "/register",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  registerSchoolWithAdmin
);
router.put(
  "/:schoolId/imagekit",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  updateImagekitCredentials
);
export default router;
