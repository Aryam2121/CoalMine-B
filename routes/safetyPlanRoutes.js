import express from "express";
import {
  createSafetyPlan,
  deleteSafetyPlan,
  getAllSafetyPlans,
  getSafetyPlanById,
  updateSafetyPlan,
  upload
} from "../controllers/safetyplanController.js";

const router = express.Router();

// ✅ Specific routes should come before dynamic ":id" routes
router.get("/getAllSafety", getAllSafetyPlans); 
router.post("/createSafety", upload.single("file"), createSafetyPlan);

// ✅ Add more specific routes here if needed before ":id"
// router.get("/:id", getSafetyPlanById);
router.put("/:id", upload.single("file"), updateSafetyPlan);
router.delete("/:id", deleteSafetyPlan);

export default router;
