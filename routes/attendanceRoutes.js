import express from "express";
const router = express.Router();
import { getWorkers,addWorker,updateAttendance,deleteWorker } from "../controllers/attendanceController.js";

router.get("/getworkers", getWorkers);
router.post("/addworkers", addWorker);
router.put("/workers/:id", updateAttendance);
router.delete("/workers/:id", deleteWorker);

export default router;