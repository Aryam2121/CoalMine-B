import express from "express";
import { getAllLocations, createLocation } from "../controllers/locationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireManager } from "../middleware/authorize.js";

const router = express.Router();

router.get("/getallloc", protect, getAllLocations);
router.post("/createloc", protect, requireManager, createLocation);

export default router;
