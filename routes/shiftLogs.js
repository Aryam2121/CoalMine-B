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
router.get('/getAllshift', getAllShiftLogs);
router.get('/getshift/:id', getShiftLogById);
router.post('/addshift', createShiftLog);
router.put('/updateshift/:id', updateShiftLog);
router.delete('/deleteshift/:id', deleteShiftLog);

export default router;
