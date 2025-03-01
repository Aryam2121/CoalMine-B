import express from 'express';
const router = express.Router();
import mineController from '../controllers/mineController.js';

router.get('/getAllMines', mineController.getAllMines);
router.post('/createMines', mineController.createMine);

export default router;
