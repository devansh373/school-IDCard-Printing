import { Router } from "express";
import { createClass, getClasses } from "../controllers/class.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN"),
  createClass
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"),
  getClasses
);

export default router;
