import { Router } from "express";
import { createSchool, getSchools } from "../controllers/school.controllers.js";

const router = Router();

router.post("/", createSchool);
router.get("/", getSchools);

export default router;
