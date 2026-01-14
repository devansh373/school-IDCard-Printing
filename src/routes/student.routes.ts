import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } from "../controllers/student.controller.js";
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

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  createStudent
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"),
  getStudentById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  updateStudent
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  deleteStudent
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
