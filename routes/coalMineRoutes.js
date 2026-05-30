import express from 'express';
import {
  getCoalMines,
  createCoalMine,
  updateCoalMine,
  deleteCoalMine,
} from '../controllers/coalMineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get('/getallMines', protect, getCoalMines);
router.post(
  '/createMines',
  protect,
  requirePermission(PERMISSIONS.COAL_MINE_WRITE),
  createCoalMine
);
router.put(
  '/updateMine/:id',
  protect,
  requirePermission(PERMISSIONS.COAL_MINE_WRITE),
  updateCoalMine
);
router.delete(
  '/deleteMine/:id',
  protect,
  requirePermission(PERMISSIONS.COAL_MINE_WRITE),
  deleteCoalMine
);

export default router;
