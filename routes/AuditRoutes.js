import express from 'express';
const router = express.Router();
import { getAuditLogs, createAuditLog } from '../controllers/AuditController.js';

router.get('/getAudit', getAuditLogs);
router.post('/addAudit', createAuditLog);

export default router;
