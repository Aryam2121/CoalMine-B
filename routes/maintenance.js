import express from 'express';
const router = express.Router();
import maintenanceController from '../controllers/maintenanceController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/getTask/:id', protect, maintenanceController.getMaintenanceById);
router.delete('/deleteTask/:id', protect, maintenanceController.deleteMaintenance);
router.get('/getallTask', protect, maintenanceController.getAllMaintenance);
router.post('/createTask', protect, maintenanceController.createMaintenance);
router.put('/updateTask/:id', protect, maintenanceController.updateMaintenance);

export default router;
