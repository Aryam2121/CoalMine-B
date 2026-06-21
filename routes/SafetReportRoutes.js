import express from "express";
import {
  getAllSafetyReports,
  getSafetyReportById,
  createSafetyReport,
  approveSafetyReport,
  deleteSafetyReport,
  upload,
} from "../controllers/SafetyController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

router.get("/getAllReports", protect, getAllSafetyReports);
router.post("/createReports", protect, requirePermission(PERMISSIONS.SAFETY_REPORT_CREATE), upload, createSafetyReport);
router.put("/reports/:id/approve", protect, requirePermission(PERMISSIONS.SAFETY_REPORT_APPROVE), approveSafetyReport);
router.delete("/reports/:id", protect, requirePermission(PERMISSIONS.SAFETY_PLAN_DELETE), deleteSafetyReport);
router.get("/reports/:id", protect, getSafetyReportById);

export default router;
