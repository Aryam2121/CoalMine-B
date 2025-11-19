import express from 'express';
import advancedAnalyticsController from '../controllers/advancedAnalyticsController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate analytics report
router.post('/mines/:mineId/analytics/generate', protect, isAdmin, advancedAnalyticsController.generateAnalyticsReport);

// Get latest analytics report
router.get('/mines/:mineId/analytics/latest', protect, advancedAnalyticsController.getLatestReport);

// Get all analytics reports
router.get('/mines/:mineId/analytics/all', protect, advancedAnalyticsController.getAllReports);

// Export analytics report
router.get('/analytics/:id/export', protect, advancedAnalyticsController.exportReport);

export default router;
