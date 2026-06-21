import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';
import capaController from '../controllers/capaController.js';

const router = express.Router();

router.get('/capa/safety-reports', protect, capaController.getSafetyReportsForCAPA);
router.get('/capa', protect, capaController.getAllCAPA);
router.get('/capa/:id', protect, capaController.getCAPAById);
router.post('/capa', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_CREATE), capaController.createCAPA);
router.put('/capa/:id', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), capaController.updateCAPA);
router.patch('/capa/:id/actions/complete', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_CREATE), capaController.completeCAPAAction);
router.patch('/capa/:id/verify', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), capaController.verifyCAPAAction);
router.patch('/capa/:id/approve-closure', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), capaController.approveCAPAClosure);
router.delete('/capa/:id', protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), capaController.deleteCAPA);

export default router;
