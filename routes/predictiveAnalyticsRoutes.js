import express from 'express';
import predictiveAnalyticsController from '../controllers/predictiveAnalyticsController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate safety prediction for a mine
router.post('/mines/:mineId/predict', protect, predictiveAnalyticsController.generateSafetyPrediction);

// Get all predictions for a mine
router.get('/mines/:mineId/predictions', protect, predictiveAnalyticsController.getPredictions);

// Get high-risk mines
router.get('/high-risk-mines', protect, predictiveAnalyticsController.getHighRiskMines);

// Generate incident prediction
router.post('/mines/:mineId/incident-prediction', protect, predictiveAnalyticsController.generateIncidentPrediction);

// Get dashboard analytics summary
router.get('/mines/:mineId/analytics', protect, predictiveAnalyticsController.getDashboardAnalytics);

export default router;
