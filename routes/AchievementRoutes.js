// routes/achievementRoutes.js
import express from 'express';
const router = express.Router();
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/authorize.js';

router.get('/getAchieve', protect, getAchievements);
router.post('/addAchieve', protect, requireAdmin, createAchievement);
// Progress updates — any authenticated user (see Achievements.jsx)
router.put('/achievements/:id', protect, updateAchievement);
router.delete('/achievements/:id', protect, requireAdmin, deleteAchievement);

export default router;
