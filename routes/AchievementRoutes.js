// routes/achievementRoutes.js
import express from 'express';
const router = express.Router();
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from "../controllers/achievementController.js";
router.get("/getAchieve", getAchievements);
router.post("/addAchieve",createAchievement);
router.put("/achievements/:id", updateAchievement);
router.delete("/:id", deleteAchievement);

export default router;
