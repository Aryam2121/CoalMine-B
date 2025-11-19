import express from 'express';
import trainingController from '../controllers/trainingController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Training Module Routes
router.post('/training', protect, isAdmin, trainingController.createTraining);
router.get('/trainings', protect, trainingController.getAllTrainings);
router.post('/training/:id/enroll', protect, trainingController.enrollInTraining);
router.patch('/training/:id/progress', protect, trainingController.updateProgress);
router.get('/user/trainings', protect, trainingController.getUserTrainings);
router.get('/user/:userId/trainings', protect, trainingController.getUserTrainings);

// Gamification & Leaderboard Routes
router.get('/leaderboard', protect, trainingController.getLeaderboard);
router.get('/leaderboard/me', protect, trainingController.getUserLeaderboardStats);
router.get('/leaderboard/:userId', protect, trainingController.getUserLeaderboardStats);
router.post('/user/:userId/achievement', protect, isAdmin, trainingController.awardAchievement);

export default router;
