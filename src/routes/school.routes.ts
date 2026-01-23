import { Router } from "express";
import {
  getSchools,
  getSchoolById,
  registerSchoolWithAdmin,
  updateImagekitCredentials,
  uploadSignatures,
  schoolSetup,
  getSchoolProfile,
} from "../controllers/school.controllers.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { uploadImage } from "../middlewares/upload-image.middleware.js";

const router = Router();

// Get all schools (Super Admin/Vendor)
router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR"),
  getSchools,
);

// Get current user's school profile
router.get(
  "/profile",
  authenticate,
  authorizeRoles("SCHOOL_ADMIN"),
  getSchoolProfile,
);

// Get specific school by ID
router.get(
  "/:schoolId",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "VENDOR", "SCHOOL_ADMIN"),
  getSchoolById,
);

// Admin: register new school
router.post(
  "/register",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  registerSchoolWithAdmin,
);

// Admin: update ImageKit credentials
router.put(
  "/:schoolId/imagekit",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  updateImagekitCredentials,
);

// School Admin/Super Admin: upload signatures
router.post(
  "/:schoolId/signatures",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  uploadImage.fields([
    { name: "principal", maxCount: 1 },
    { name: "authority", maxCount: 1 },
  ]),
  uploadSignatures,
);

// School Admin: setup school
router.put(
  "/setup",
  authenticate,
  authorizeRoles("SCHOOL_ADMIN"),
  uploadImage.fields([
    { name: "logo", maxCount: 1 },
    { name: "templateFront", maxCount: 1 },
    { name: "templateBack", maxCount: 1 },
  ]),
  schoolSetup,
);

// Super Admin: setup specific school
router.put(
  "/:schoolId/setup",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  uploadImage.fields([
    { name: "logo", maxCount: 1 },
    { name: "templateFront", maxCount: 1 },
    { name: "templateBack", maxCount: 1 },
  ]),
  schoolSetup,
);

export default router;
