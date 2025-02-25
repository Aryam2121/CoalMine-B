import express from "express";
import {
  getAllSafetyReports,
  getSafetyReportById,
  createSafetyReport,
  approveSafetyReport,
  deleteSafetyReport,
  upload,
} from "../controllers/SafetyController.js";

const router = express.Router();

router.get("/getAllReports", getAllSafetyReports);
router.get("/:id", getSafetyReportById);
router.post("/createReports", upload, createSafetyReport);
router.put("/:id/approve", approveSafetyReport);
router.delete("/:id", deleteSafetyReport);

export default router;
