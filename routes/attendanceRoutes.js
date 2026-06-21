import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/authorize.js";
import { PERMISSIONS } from "../config/roles.js";
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
router.put("/attendance", protect, upsertAttendance);
router.put("/attendance/bulk", protect, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE_ALL), bulkUpsertAttendance);
router.get("/attendance/summary", protect, getAttendanceSummary);
router.get("/getworkers", protect, getWorkers);
router.post("/addworkers", protect, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE_ALL), addWorker);
router.put("/workers/:id", protect, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE_ALL), updateAttendance);
router.delete("/workers/:id", protect, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE_ALL), deleteWorker);

export default router;
