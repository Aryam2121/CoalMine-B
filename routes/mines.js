import express from 'express';
const router = express.Router();
import mineController from '../controllers/mineController.js';

router.get('/', mineController.getAllMines);
router.post('/', mineController.createMine);

export default router;
