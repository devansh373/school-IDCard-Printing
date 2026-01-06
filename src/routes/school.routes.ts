import { Router } from "express";
import { createSchool, getSchools } from "../controllers/school.controllers.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { authorizeRoles } from "../middleware/authorize.middleware.js";

const router = Router();

router.post("/", authenticate,authorizeRoles("SUPER_ADMIN"), createSchool);
router.get("/", authenticate,authorizeRoles("SUPER_ADMIN"), getSchools);

export default router;
