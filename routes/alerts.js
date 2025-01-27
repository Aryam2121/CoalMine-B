import express from 'express';
const router = express.Router();
import alertController from '../controllers/alertController.js';

// Define the routes for alerts
router.get('/getallalerts', alertController.getAllAlerts);
router.post('/addAlert', alertController.createAlert);
router.delete('/deleteAlert/:id', alertController.deleteAlert);
router.put('/resolveAlert/:id', alertController.resolveAlert);
export default router;
