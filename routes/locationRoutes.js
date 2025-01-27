import express from "express";

import { getAllLocations, createLocation } from "../controllers/locationController.js";
const router = express.Router();

// Route for getting all locations
router.get("/getallloc", getAllLocations);

// Route for creating a new location
router.post("/createloc", createLocation);

export default router;
