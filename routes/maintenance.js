import express from 'express';
const router = express.Router();
import maintenanceController from '../controllers/maintenanceController.js';

router.get('/getallTask', maintenanceController.getAllMaintenance);
router.post('/createTask', maintenanceController.createMaintenance);

export default router;
