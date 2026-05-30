import express from 'express';
import { getReports, createReport, updateReport, deleteReport } from "../controllers/CompilanceController.js";
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/authorize.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get("/getReports", protect, getReports);
router.post("/addReports", protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), createReport);
router.put("/updateReport/:id", protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), updateReport);
router.delete("/deleteReport/:id", protect, requirePermission(PERMISSIONS.COMPLIANCE_WRITE), deleteReport);

export default router;
