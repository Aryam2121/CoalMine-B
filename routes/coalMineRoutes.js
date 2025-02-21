import express from 'express';
import { getCoalMines, createCoalMine,updateCoalMine,deleteCoalMine } from '../controllers/coalMineController.js';
const router = express.Router();

// Get all coal mines
router.get('/getallMines', getCoalMines);

// Add a new coal mine
router.post('/createMines', createCoalMine);
router.put('/updateMines',updateCoalMine);
router.delete('/deleteMines',deleteCoalMine);

export default router;  
