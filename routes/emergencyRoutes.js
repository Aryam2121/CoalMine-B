import express from 'express';
import emergencyResponseController from '../controllers/emergencyResponseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create emergency (SOS)
router.post('/emergency', protect, emergencyResponseController.createEmergency);

// Get all emergencies with filtering
router.get('/emergencies', protect, emergencyResponseController.getAllEmergencies);

// Get active emergencies
router.get('/emergencies/active', protect, emergencyResponseController.getActiveEmergencies);

// Get emergency by ID
router.get('/emergency/:id', protect, emergencyResponseController.getEmergencyById);

// Update emergency status
router.patch('/emergency/:id/status', protect, emergencyResponseController.updateEmergencyStatus);

// Assign response team
router.post('/emergency/:id/assign-team', protect, emergencyResponseController.assignResponseTeam);

// Add communication log
router.post('/emergency/:id/communication', protect, emergencyResponseController.addCommunicationLog);

// Initiate evacuation
router.post('/emergency/:id/evacuate', protect, emergencyResponseController.initiateEvacuation);

// Submit post-incident report
router.post('/emergency/:id/report', protect, emergencyResponseController.submitPostIncidentReport);

export default router;
