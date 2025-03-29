import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';
import { protect, isAdmin } from "../middleware/authMiddleware.js";

// Routes
// Public Routes
router.post("/", userController.createUser); // Register
router.get("users/me/:id", userController.getUserById); // Get User By ID (Public)
router.get("/me", protect, userController.getMyProfile);

// Protected Routes (Login Required)
router.get("/", protect, userController.getAllUsers); // Get all users
router.put("/:id", protect, userController.updateUser); // Update profile
router.delete("/:id", protect, isAdmin, userController.deleteUser); // Delete (Only Admin)


export default router;
