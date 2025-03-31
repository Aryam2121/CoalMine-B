import express from "express";
import { submitSafetyCheck, getUserSafetyChecks } from "../controllers/safetyCheckController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/safety-check", protect, submitSafetyCheck);
router.get("/getAllsafety-check", protect, getUserSafetyChecks);

export default router;
