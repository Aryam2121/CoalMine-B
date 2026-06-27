import express from 'express';
import predictiveAnalyticsController from '../controllers/predictiveAnalyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.post('/mines/:mineId/predict', protect, requirePermission(PERMISSIONS.ANALYTICS_VIEW), predictiveAnalyticsController.generateSafetyPrediction);
router.get('/mines/:mineId/predictions', protect, predictiveAnalyticsController.getPredictions);
router.get('/high-risk-mines', protect, predictiveAnalyticsController.getHighRiskMines);
router.post('/mines/:mineId/incident-prediction', protect, requirePermission(PERMISSIONS.ANALYTICS_VIEW), predictiveAnalyticsController.generateIncidentPrediction);
router.get('/mines/:mineId/incident-predictions', protect, requirePermission(PERMISSIONS.ANALYTICS_VIEW), predictiveAnalyticsController.getIncidentPredictions);
router.get('/mines/:mineId/analytics', protect, predictiveAnalyticsController.getDashboardAnalytics);

export default router;
