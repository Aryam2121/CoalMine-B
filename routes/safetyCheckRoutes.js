import express from "express";
import { submitSafetyCheck, getUserSafetyChecks, getShiftCheckStatus } from "../controllers/safetyCheckController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads/safety-checks");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(null, `check-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

const router = express.Router();

router.post("/safety-check", protect, upload.array("images", 5), submitSafetyCheck);
router.get("/safety-checks/me", protect, getUserSafetyChecks);
router.get("/safety-check/status", protect, getShiftCheckStatus);

export default router;
