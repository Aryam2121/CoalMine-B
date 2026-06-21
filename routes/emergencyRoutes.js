import express from 'express';
import emergencyResponseController from '../controllers/emergencyResponseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.post('/emergency', protect, requirePermission(PERMISSIONS.EMERGENCY_SOS), emergencyResponseController.createEmergency);
router.get('/emergencies', protect, emergencyResponseController.getAllEmergencies);
router.get('/emergencies/active', protect, emergencyResponseController.getActiveEmergencies);
router.get('/emergency/:id', protect, emergencyResponseController.getEmergencyById);
router.patch('/emergency/:id/status', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.updateEmergencyStatus);
router.post('/emergency/:id/assign-team', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.assignResponseTeam);
router.post('/emergency/:id/communication', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.addCommunicationLog);
router.post('/emergency/:id/evacuate', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.initiateEvacuation);
router.post('/emergency/:id/report', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.submitPostIncidentReport);

export default router;
