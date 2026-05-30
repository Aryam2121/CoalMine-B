import express from 'express';
const router = express.Router();
import { getAuditLogs, createAuditLog } from '../controllers/AuditController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

router.get('/getAudit', protect, requirePermission(PERMISSIONS.AUDIT_READ), getAuditLogs);
router.post('/addAudit', protect, createAuditLog);

export default router;
