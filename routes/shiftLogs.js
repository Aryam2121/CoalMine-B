import express from 'express';
import {
  getAllShiftLogs,
  createShiftLog,
  updateShiftLog,
  deleteShiftLog,
} from '../controllers/shiftlogsController.js';
import upload from '../config/multerConfig.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getAllLogs', protect, getAllShiftLogs);
router.post('/createLogs', protect, upload.single('file'), createShiftLog);
router.put('/updateLog/:id', protect, updateShiftLog);
router.delete('/deleteLog/:id', protect, deleteShiftLog);

export default router;
