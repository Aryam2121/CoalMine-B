import express from 'express';
const router = express.Router();
import mineController from '../controllers/mineController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/getAllMines', protect, mineController.getAllMines);
router.post('/createMines', protect, mineController.createMine);

export default router;
