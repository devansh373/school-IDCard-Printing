import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { getAllVendors, registerVendor, assignSchoolToVendor, removeSchoolFromVendor, getVendorSchools } from "../controllers/vendor.controller.js";
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

router.post(
  "/:vendorId/schools",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  assignSchoolToVendor
);

router.delete(
  "/:vendorId/schools/:schoolId",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  removeSchoolFromVendor
);

router.get(
    "/schools",
    authenticate,
    authorizeRoles("VENDOR"),
  getVendorSchools
);

router.get(
    "/:vendorId/schools",
    authenticate,
    authorizeRoles("SUPER_ADMIN","VENDOR"),
  getVendorSchools
);

export default router;
