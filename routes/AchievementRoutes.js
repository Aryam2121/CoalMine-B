// routes/achievementRoutes.js
import express from "express";
const router = express.Router();
import {getAchievements,createAchievement,updateAchievement,deleteAchievement} from "../controllers/AchievementController.js";

router.get("/getAchieve", getAchievements);
router.post("/addAchieve",createAchievement);
router.put("/:id", updateAchievement);
router.delete("/:id", deleteAchievement);

module.exports = router;
