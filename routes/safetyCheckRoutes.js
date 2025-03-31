import express from "express";
import { submitSafetyCheck, getUserSafetyChecks } from "../controllers/safetyCheckController.js";


const router = express.Router();

router.post("/safety-check", submitSafetyCheck);
router.get("/getAllsafety-check", getUserSafetyChecks);

export default router;
