import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';
import complianceCenterController from '../controllers/complianceCenterController.js';

const router = express.Router();

router.get('/compliance-center', protect, complianceCenterController.getComplianceRecords);
router.get('/compliance-center/reminders', protect, complianceCenterController.getComplianceReminders);
router.post('/compliance-center', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), complianceCenterController.createComplianceRecord);
router.put('/compliance-center/:id', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), complianceCenterController.updateComplianceRecord);
router.delete('/compliance-center/:id', protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), complianceCenterController.deleteComplianceRecord);

export default router;
