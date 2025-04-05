import express from 'express';
import { 
  getAllShiftLogs, 
 
  createShiftLog, 
  updateShiftLog, 
  deleteShiftLog 
} from '../controllers/shiftlogsController.js'; // Adjust the path if needed
import upload from '../config/multerConfig.js';
const router = express.Router();

// Routes for shift logs
router.get('/getAllLogs', getAllShiftLogs);
router.post('/createLogs', upload.single('file'),createShiftLog);
router.put('/updateLog/:id', updateShiftLog);
router.delete('/deleteLog/:id', deleteShiftLog);

export default router;
