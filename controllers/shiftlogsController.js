// import express from 'express';
// import ShiftLog from '../models/ShiftLog.js';
// import multer from 'multer';
// import mongoose from 'mongoose';

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Get all shift logs
// const getAllShiftLogs = async (req, res) => {
//   try {
//     const shiftLogs = await ShiftLog.find().lean(); 

//     if (shiftLogs.length === 0) {
//       return res.status(404).json({ message: "No shift logs found" });
//     }

//     res.status(200).json(shiftLogs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching shift logs", error: error.message });
//   }
// };

// // Get a single shift log by ID
// const getShiftLogById = async (req, res) => {
//   try {
//     const shiftLog = await ShiftLog.findById(req.params.id);

//     if (!shiftLog) {
//       return res.status(404).json({ message: "Shift log not found" });
//     }

//     res.status(200).json(shiftLog);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching shift log", error: error.message });
//   }
// };

// // Create a new shift log
// const createShiftLog = async (req, res) => {
//   try {
//     const { shiftDetails, shiftDate, shiftStartTime, shiftEndTime, status, notes } = req.body;
//     const file = req.file; // Binary file (if uploaded)

//     // Ensure shiftDate is a valid string
//     if (!shiftDetails || !shiftDate || !shiftStartTime || !shiftEndTime) {
//       return res.status(400).json({ message: "All required fields must be filled" });
//     }


//     // Prepare ShiftLog object
//     const shiftLog = new ShiftLog({
//       shiftDetails,
//       shiftDate, // Store shiftDate as a string
//       shiftStartTime,
//       shiftEndTime,
//       status: status || "pending",
//       notes,
//       file: file ? file.buffer : null, // Store raw buffer data (or use GridFS)
//     });

//     await shiftLog.save();
//     res.status(201).json({ message: "Shift log created successfully", shiftLog });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating shift log", error: error.message });
//   }
// };


// // Update an existing shift log
// const updateShiftLog = async (req, res) => {
//   try {
//     const { shiftDetails, shiftDate, shiftStartTime, shiftEndTime, status, notes } = req.body;

//     if (!shiftDetails || !shiftDate || !shiftStartTime || !shiftEndTime) {
//       return res.status(400).json({ message: "Shift details, date, start time, and end time are required" });
//     }

//     const parsedShiftDate = new Date(shiftDate);
//     if (isNaN(parsedShiftDate.getTime())) {
//       return res.status(400).json({ message: "Invalid shiftDate format" });
//     }

//     const shiftLog = await ShiftLog.findByIdAndUpdate(
//       req.params.id,
//       { shiftDetails, shiftDate: parsedShiftDate, shiftStartTime, shiftEndTime, status, notes },
//       { new: true }
//     );

//     if (!shiftLog) {
//       return res.status(404).json({ message: "Shift log not found" });
//     }

//     res.status(200).json(shiftLog);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error updating shift log", error: error.message });
//   }
// };

// // Delete a shift log by ID
// const deleteShiftLog = async (req, res) => {
//   try {
//     const shiftLog = await ShiftLog.findByIdAndDelete(req.params.id);
//     if (!shiftLog) {
//       return res.status(404).json({ message: "Shift log not found" });
//     }

//     res.status(200).json({ message: "Shift log deleted successfully" });
//   } catch (error) {
//     console.error(error);  // Log error for debugging
//     res.status(500).json({ message: "Error deleting shift log", error: error.message });
//   }
// };

// export { getAllShiftLogs, getShiftLogById, createShiftLog, updateShiftLog, deleteShiftLog };
import express from 'express';
import ShiftLog from '../models/ShiftLog.js';
import multer from 'multer';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all shift logs
const getAllShiftLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const shiftLogs = await ShiftLog.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    if (!shiftLogs.length) {
      return res.status(404).json({ message: "No shift logs found" });
    }

    res.status(200).json({ shiftLogs, page, limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching shift logs", error: error.message });
  }
};

// Get a single shift log by ID
const getShiftLogById = async (req, res) => {
  try {
    const shiftLog = await ShiftLog.findById(req.params.id);

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
    console.log("Received Payload:", req.body);
    console.log("Received File:", req.file);

    const { shiftDetails, shiftStartTime, shiftEndTime, status, notes } = req.body;

    if (!shiftDetails || !shiftStartTime || !shiftEndTime) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    let fileUrl = null;
    if (req.file) {
      const uploadedFile = await cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ message: "File upload failed", error: error.message });
          }
          fileUrl = result.secure_url;
        }
      ).end(req.file.buffer);
      fileUrl = uploadedFile.secure_url;
    }

    const shiftLog = new ShiftLog({
      shiftDetails,
      shiftStartTime,
      shiftEndTime,
      status: status || "pending",
      notes,
      fileUrl, // Store Cloudinary URL instead of buffer
    });

    await shiftLog.save();
    res.status(201).json({ message: "Shift log created successfully", shiftLog });
  } catch (error) {
    console.error("Error Creating Shift Log:", error);
    res.status(500).json({ message: "Error creating shift log", error: error.message });
  }
};



// Update an existing shift log
const updateShiftLog = async (req, res) => {
  try {
    const { shiftDetails, shiftStartTime, shiftEndTime, status, notes } = req.body;

    if (!shiftDetails || !shiftStartTime || !shiftEndTime) {
      return res.status(400).json({ message: "Shift details, start time, and end time are required" });
    }

    const shiftLog = await ShiftLog.findByIdAndUpdate(
      req.params.id,
      { shiftDetails, shiftStartTime, shiftEndTime, status, notes },
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

export  { getAllShiftLogs, getShiftLogById, createShiftLog, updateShiftLog, deleteShiftLog };
