import express from 'express';
const router = express.Router();
import mineController from '../controllers/mineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

router.get('/getAllMines', protect, mineController.getAllMines);
router.post('/createMines', protect, requirePermission(PERMISSIONS.COAL_MINE_WRITE), mineController.createMine);

export default router;
