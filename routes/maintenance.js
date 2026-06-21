import express from 'express';
const router = express.Router();
import maintenanceController from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

router.get('/getTask/:id', protect, maintenanceController.getMaintenanceById);
router.get('/maintenance/overdue', protect, maintenanceController.getOverdueTasks);
router.get('/maintenance/overdue/:mineId', protect, maintenanceController.getOverdueTasks);
router.get('/getallTask', protect, maintenanceController.getAllMaintenance);
router.post('/createTask', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), maintenanceController.createMaintenance);
router.put('/updateTask/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), maintenanceController.updateMaintenance);
router.delete('/deleteTask/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), maintenanceController.deleteMaintenance);

export default router;
