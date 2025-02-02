import express from 'express';
import { 
  getAllShiftLogs, 
  getShiftLogById, 
  createShiftLog, 
  updateShiftLog, 
  deleteShiftLog 
} from '../controllers/shiftlogsController.js'; // Adjust the path if needed

const router = express.Router();

// Routes for shift logs
router.get('/getAllLogs', getAllShiftLogs);
router.get('/getshift/:id', getShiftLogById);
router.post('/createLogs', createShiftLog);
router.put('/updateLog/:id', updateShiftLog);
router.delete('/deleteLog/:id', deleteShiftLog);

export default router;
