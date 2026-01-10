import { Router } from "express";
import { changePassword, login, logout } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post(
  "/change-password",
  authenticate,
  changePassword
);

export default router;
