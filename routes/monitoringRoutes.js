import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireManager } from '../middleware/authorize.js';
import {
  getMonitoring,
  getAlertHeatmap,
  patchEquipmentStatus,
  patchEnvironment,
  processRemindersNow,
} from '../controllers/monitoringController.js';

const router = express.Router();

router.get('/monitoring/heatmap/alerts', protect, getAlertHeatmap);
router.get('/monitoring/:mineId', protect, getMonitoring);
router.patch('/monitoring/:mineId/equipment/:equipmentId', protect, requireManager, patchEquipmentStatus);
router.patch('/monitoring/:mineId/environment', protect, requireManager, patchEnvironment);
router.post('/compliance-center/process-reminders', protect, requireManager, processRemindersNow);

export default router;
