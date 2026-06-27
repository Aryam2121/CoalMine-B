import express from 'express';
import emergencyResponseController from '../controllers/emergencyResponseController.js';
import safetyFeaturesController from '../controllers/safetyFeaturesController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

// Evacuation & muster (extends emergency)
router.post('/emergency/:id/evacuate', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.initiateEvacuation);
router.get('/emergency/:id/muster', protect, emergencyResponseController.getMusterStatus);
router.post('/emergency/:id/muster/safe', protect, emergencyResponseController.reportMusterSafe);
router.patch('/emergency/:id/muster/:userId', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.updateMusterStatus);
router.post('/emergency/:id/evacuation/complete', protect, requirePermission(PERMISSIONS.EMERGENCY_MANAGE), emergencyResponseController.completeEvacuation);

// Work permits
router.get('/work-permits', protect, safetyFeaturesController.listWorkPermits);
router.post('/work-permits', protect, safetyFeaturesController.createWorkPermit);
router.get('/work-permits/:id', protect, safetyFeaturesController.getWorkPermit);
router.put('/work-permits/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.updateWorkPermit);
router.delete('/work-permits/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.deleteWorkPermit);
router.post('/work-permits/:id/approve', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.approveWorkPermit);

// Equipment registry
router.get('/equipment-registry', protect, safetyFeaturesController.listEquipment);
router.post('/equipment-registry', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.createEquipment);
router.get('/equipment-registry/:id', protect, safetyFeaturesController.getEquipment);
router.put('/equipment-registry/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.updateEquipment);
router.delete('/equipment-registry/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.deleteEquipment);

// Hazard zones
router.get('/hazard-zones', protect, safetyFeaturesController.listHazardZones);
router.post('/hazard-zones', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.createHazardZone);
router.get('/hazard-zones/:id', protect, safetyFeaturesController.getHazardZone);
router.put('/hazard-zones/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.updateHazardZone);
router.delete('/hazard-zones/:id', protect, requirePermission(PERMISSIONS.DASHBOARD_MAINTENANCE), safetyFeaturesController.deleteHazardZone);

// Near-miss reports
router.get('/near-miss', protect, safetyFeaturesController.listNearMiss);
router.post('/near-miss', protect, safetyFeaturesController.createNearMiss);
router.get('/near-miss/:id', protect, safetyFeaturesController.getNearMiss);
router.put('/near-miss/:id', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), safetyFeaturesController.updateNearMiss);
router.post('/near-miss/:id/escalate-capa', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), safetyFeaturesController.escalateNearMissToCapa);

// Safety drills
router.get('/safety-drills', protect, safetyFeaturesController.listDrills);
router.post('/safety-drills', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.createDrill);
router.get('/safety-drills/:id', protect, safetyFeaturesController.getDrill);
router.put('/safety-drills/:id', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.updateDrill);
router.delete('/safety-drills/:id', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.deleteDrill);
router.post('/safety-drills/:id/complete', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.completeDrill);

// Contractors & visitors
router.get('/contractors', protect, safetyFeaturesController.listContractors);
router.post('/contractors', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.createContractor);
router.get('/contractors/:id', protect, safetyFeaturesController.getContractor);
router.put('/contractors/:id', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.updateContractor);
router.post('/contractors/:id/checkout', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), safetyFeaturesController.checkOutContractor);

// Push token + maintenance schedule
router.post('/notifications/register-token', protect, safetyFeaturesController.registerFcmToken);
router.get('/maintenance/schedule', protect, safetyFeaturesController.getMaintenanceSchedule);

export default router;
