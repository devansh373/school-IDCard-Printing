import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { getStudents, getStudentById } from "../controllers/student.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { importStudents } from "../controllers/student-import.controller.js";
import { uploadImage } from "../middlewares/upload-image.middleware.js";
import { uploadStudentPhoto } from "../controllers/student.controller.js";
const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"),
  getStudents
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"),
  getStudentById
);


router.post(
  "/import",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  upload.single("file"),
  importStudents
);



router.post(
  "/:id/photo",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  uploadImage.single("photo"),
  uploadStudentPhoto
);

export default router;
