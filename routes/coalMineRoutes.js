import express from 'express';
import { getCoalMines, createCoalMine } from '../controllers/coalMineController.js';
import CoalMine from '../models/CoalMine.js';
const router = express.Router();

// Get all coal mines
router.get('/getallMines', getCoalMines);

// Add a new coal mine
router.post('/createMines', createCoalMine);

export default router;  
