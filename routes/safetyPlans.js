import express from "express";
import {
  createSafetyPlan,
  deleteSafetyPlan,
  getAllSafetyPlans,
  getSafetyPlanById,
  updateSafetyPlan,upload
} from "../controllers/safetyplanController.js";

const router = express.Router();

router.get("/getAllSafety", getAllSafetyPlans);
router.get("/:id", getSafetyPlanById);
router.post("/createSafety", upload.single("file"), createSafetyPlan);
router.put("/:id", upload.single("file"), updateSafetyPlan);
router.delete("/:id", deleteSafetyPlan);

export default router;
