import express from 'express';
const router = express.Router();
import maintenanceController from '../controllers/maintenanceController.js';
router.get('/getTask/:id', maintenanceController.getMaintenanceById);
router.delete('/deleteTask/:id', maintenanceController.deleteMaintenance);
router.get('/getallTask', maintenanceController.getAllMaintenance);
router.post('/createTask', maintenanceController.createMaintenance);
router.put('/updateTask/:id', maintenanceController.updateMaintenance);
export default router;
