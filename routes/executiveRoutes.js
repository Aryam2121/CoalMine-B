import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';
import executiveController from '../controllers/executiveController.js';

const router = express.Router();

router.get('/executive/summary', protect, requirePermission(PERMISSIONS.ANALYTICS_VIEW), executiveController.getExecutiveSummary);

export default router;
