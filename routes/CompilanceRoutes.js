import express from 'express';
import { getReports,createReport, updateReport,deleteReport } from "../controllers/CompilanceController.js";
const router = express.Router();
router.get("/getReports",  getReports);
router.post("/addReports",  createReport);
router.put("/:id",  updateReport);
router.delete("/:id",  deleteReport);

export default router;
