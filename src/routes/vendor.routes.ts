import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { getAllVendors, registerVendor } from "../controllers/vendor.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post(
  "/register",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  registerVendor
);

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getAllVendors
);

export default router;
