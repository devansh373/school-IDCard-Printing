import { Router } from "express";
import { createSchool, getSchools } from "../controllers/school.controllers.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/", authenticate,authorizeRoles("SUPER_ADMIN"), createSchool);
router.get("/", authenticate,authorizeRoles("SUPER_ADMIN"), getSchools);

export default router;
