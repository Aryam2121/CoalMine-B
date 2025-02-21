import express from 'express';
import { getCoalMines, createCoalMine,updateCoalMine,deleteCoalMine } from '../controllers/coalMineController.js';
const router = express.Router();

// Get all coal mines
router.get('/getallMines', getCoalMines);

// Add a new coal mine
router.post('/createMines', createCoalMine);
router.put('/updateMine/:id',updateCoalMine);
router.delete('/deleteMine/:id',deleteCoalMine);

export default router;  
