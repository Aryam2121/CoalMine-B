import express from "express";
import { submitSafetyCheck } from "../controllers/safetyCheckController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/safety-check", protect, submitSafetyCheck);
// router.get("/getAllsafety-check", getUserSafetyChecks);

export default router;
