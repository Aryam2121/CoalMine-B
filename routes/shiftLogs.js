import express from 'express';
import {
  getAllShiftLogs,
  createShiftLog,
  updateShiftLog,
  deleteShiftLog,
} from '../controllers/shiftlogsController.js';
import upload from '../config/multerConfig.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission, requireManager } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get('/getAllLogs', protect, getAllShiftLogs);
router.post('/createLogs', protect, requirePermission(PERMISSIONS.SHIFT_LOG_CREATE), upload.single('file'), createShiftLog);
router.put('/updateLog/:id', protect, requireManager, updateShiftLog);
router.delete('/deleteLog/:id', protect, requireManager, deleteShiftLog);

export default router;
