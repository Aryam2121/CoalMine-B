import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import { requireAdmin, requirePermission } from "../middleware/authorize.js";
import { PERMISSIONS } from "../config/roles.js";

router.get("/users/me/:id", protect, userController.getUserById);
router.get("/me", protect, userController.getMyProfile);
router.get("/getAllusersByrole", protect, userController.getAllUsersByRole);
router.get("/getAllusers", protect, requirePermission(PERMISSIONS.USER_MANAGE), userController.getAllUsers);
router.post("/", protect, requireAdmin, userController.createUser);
router.put("/:id", protect, requireAdmin, userController.updateUser);
router.put("/profile/:id", protect, userController.updateMyProfile);
router.delete("/:id", protect, isAdmin, userController.deleteUser);


export default router;
