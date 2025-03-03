import express from 'express';
import ShiftLog from '../models/ShiftLog.js';
import multer from 'multer';
import mongoose from 'mongoose';
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all shift logs
const getAllShiftLogs = async (req, res) => {
  try {
    const shiftLogs = await ShiftLog.find().populate('workerId', 'name').lean(); 
    
    if (shiftLogs.length === 0) {
      return res.status(404).json({ message: "No shift logs found" });
    }

    res.status(200).json(shiftLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching shift logs", error: error.message });
  }
};


// Get a single shift log by ID
// Get a single shift log by ID
const getShiftLogById = async (req, res) => {
  try {
    const shiftLog = await ShiftLog.findById(req.params.id).populate('workerId', 'name');

    if (!shiftLog) {
      return res.status(404).json({ message: "Shift log not found" });
    }

    res.status(200).json(shiftLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching shift log", error: error.message });
  }
};


// Create a new shift log
const createShiftLog = async (req, res) => {
  try {
    const { shiftDetails, shiftDate, shiftStartTime, shiftEndTime, workerId, status, notes } = req.body;
    const file = req.file; // Binary file (if uploaded)

    // Validate workerId format
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ message: "Invalid workerId format" });
    }

    // Convert shiftDate to Date object
    const parsedShiftDate = new Date(shiftDate);
    if (isNaN(parsedShiftDate.getTime())) {
      return res.status(400).json({ message: "Invalid shiftDate format" });
    }

    // Prepare ShiftLog object
    const shiftLog = new ShiftLog({
      shiftDetails,
      shiftDate: parsedShiftDate,
      shiftStartTime,
      shiftEndTime,
      workerId: new mongoose.Types.ObjectId(workerId),
      status: status || "pending",
      notes,
      file: file ? file.buffer : null, // Store raw buffer data (or use GridFS)
    });

    await shiftLog.save();
    res.status(201).json({ message: "Shift log created successfully", shiftLog });
  } catch (error) {
    res.status(500).json({ message: "Error creating shift log", error: error.message });
  }
};

// Update an existing shift log
const updateShiftLog = async (req, res) => {
  try {
    const { shiftDetails, shiftDate, shiftStartTime, shiftEndTime, status, notes } = req.body;

    if (!shiftDetails || !shiftDate || !shiftStartTime || !shiftEndTime) {
      return res.status(400).json({ message: "Shift details, date, start time, and end time are required" });
    }

    const parsedShiftDate = new Date(shiftDate);
    if (isNaN(parsedShiftDate.getTime())) {
      return res.status(400).json({ message: "Invalid shiftDate format" });
    }

    const shiftLog = await ShiftLog.findByIdAndUpdate(
      req.params.id,
      { shiftDetails, shiftDate: parsedShiftDate, shiftStartTime, shiftEndTime, status, notes },
      { new: true }
    );

    if (!shiftLog) {
      return res.status(404).json({ message: "Shift log not found" });
    }

    res.status(200).json(shiftLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating shift log", error: error.message });
  }
};


// Delete a shift log by ID
const deleteShiftLog = async (req, res) => {
  try {
    const shiftLog = await ShiftLog.findByIdAndDelete(req.params.id);
    if (!shiftLog) {
      return res.status(404).json({ message: "Shift log not found" });
    }

    res.status(200).json({ message: "Shift log deleted successfully" });
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error deleting shift log", error: error.message });
  }
};
export { getAllShiftLogs, getShiftLogById, createShiftLog, updateShiftLog, deleteShiftLog };