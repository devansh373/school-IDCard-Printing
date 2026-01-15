import { Router } from "express";
import {  getSchools, getSchoolById, registerSchoolWithAdmin, updateImagekitCredentials, uploadSignatures } from "../controllers/school.controllers.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { uploadImage } from "../middlewares/upload-image.middleware.js";

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
// Upload signatures (principal, authority, or both)
router.post(
  "/:schoolId/signatures",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  uploadImage.fields([
    { name: "principal", maxCount: 1 },
    { name: "authority", maxCount: 1 }
  ]),
  uploadSignatures
);
export default router;
