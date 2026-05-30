import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAttendanceForDate,
  upsertAttendance,
  bulkUpsertAttendance,
  getAttendanceSummary,
  getWorkers,
  addWorker,
  updateAttendance,
  deleteWorker,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/attendance", protect, getAttendanceForDate);
router.put("/attendance/bulk", protect, bulkUpsertAttendance);
router.put("/attendance", protect, upsertAttendance);
router.get("/attendance/summary", protect, getAttendanceSummary);

// Legacy routes
router.get("/getworkers", protect, getWorkers);
router.post("/addworkers", protect, addWorker);
router.put("/workers/:id", protect, updateAttendance);
router.delete("/workers/:id", protect, deleteWorker);

export default router;
