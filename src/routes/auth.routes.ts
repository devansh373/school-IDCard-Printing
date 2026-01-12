import { Router } from "express";
import { changePassword, login, logout, getProfile, updateProfile, adminUpdateUser, getUser, getAllUsers, getAllSchoolAdmins } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post(
  "/change-password",
  authenticate,
  changePassword
);

router.get(
  "/profile",
  authenticate,
  getProfile
);

router.put(
  "/profile",
  authenticate,
  updateProfile
);

router.put(
  "/users/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  adminUpdateUser
);

router.get(
  "/users/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getUser
);

router.get(
  "/users",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getAllUsers
);



router.get(
  "/school-admins",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getAllSchoolAdmins
);

export default router;
