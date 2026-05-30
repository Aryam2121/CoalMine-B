import express from "express";
import {
  createSafetyPlan,
  deleteSafetyPlan,
  getAllSafetyPlans,
  updateSafetyPlan,
} from "../controllers/safetyplanController.js";
import upload from "../config/multerConfig.js";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

router.get("/getAllSafety", protect, getAllSafetyPlans);
router.post(
  "/createSafety",
  protect,
  requirePermission(PERMISSIONS.SAFETY_PLAN_CREATE),
  upload.single("file"),
  createSafetyPlan
);
router.put(
  "/updateSafety/:id",
  protect,
  requirePermission(PERMISSIONS.SAFETY_PLAN_CREATE),
  upload.single("file"),
  updateSafetyPlan
);
router.delete(
  "/safety/:id",
  protect,
  requirePermission(PERMISSIONS.SAFETY_PLAN_DELETE),
  deleteSafetyPlan
);

export default router;
