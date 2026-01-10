import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { registerVendor } from "../controllers/vendor.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post(
  "/register",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  registerVendor
);

export default router;
