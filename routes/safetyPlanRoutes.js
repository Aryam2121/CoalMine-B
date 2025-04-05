import express from "express";
import {
  createSafetyPlan,
  deleteSafetyPlan,
  getAllSafetyPlans,

  updateSafetyPlan,

} from "../controllers/safetyplanController.js";
import upload from "../config/multerConfig.js"; // Import the multer configuration
const router = express.Router();

// ✅ Specific routes should come before dynamic ":id" routes
router.get("/getAllSafety", getAllSafetyPlans); 
router.post("/createSafety", upload.single("file"), createSafetyPlan);

// ✅ Add more specific routes here if needed before ":id"
// router.get("/:id", getSafetyPlanById);
router.put("/:id", upload.single("file"), updateSafetyPlan);
router.delete("/:id", deleteSafetyPlan);

export default router;
