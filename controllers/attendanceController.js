import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";

// Get all workers
const getWorkers = async (req, res) => {
  try {
    const workers = await Attendance.find();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new worker with validation
const addWorker = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newWorker = new Attendance(req.body);
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update worker attendance status
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid worker ID" });
    }

    const worker = await Attendance.findByIdAndUpdate(id, { status }, { new: true });
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    res.json(worker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a worker
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid worker ID" });
    }

    const worker = await Attendance.findByIdAndDelete(id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    res.json({ message: "Worker deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getWorkers, addWorker, updateAttendance, deleteWorker };
