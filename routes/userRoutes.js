import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';

// Routes
router.get('/', userController.getAllUsers); // Get all users
router.get('/:id', userController.getUserById); // Get a single user by ID
router.post('/', userController.createUser); // Create a new user
router.put('/:id', userController.updateUser); // Update a user by ID
router.delete('/:id', userController.deleteUser); // Delete a user by ID

export default router;
