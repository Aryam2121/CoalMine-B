import express from 'express';
const router = express.Router();
import alertController from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

router.get('/getallalerts', protect, alertController.getAllAlerts);
router.post('/addAlert', protect, requirePermission(PERMISSIONS.ALERT_CREATE), alertController.createAlert);
router.delete('/deleteAlert/:id', protect, requirePermission(PERMISSIONS.ALERT_RESOLVE), alertController.deleteAlert);
router.put('/resolveAlert/:id', protect, requirePermission(PERMISSIONS.ALERT_RESOLVE), alertController.resolveAlert);
router.put('/resolveAllAlerts', protect, requirePermission(PERMISSIONS.ALERT_RESOLVE_ALL), alertController.resolveAllAlerts);

export default router;
