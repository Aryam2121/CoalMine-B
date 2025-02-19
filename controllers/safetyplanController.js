import SafetyPlan from "../models/SafetyPlanModel.js";
import multer from "multer";
import path from "path";

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/safety-plans/"); // Save files in 'uploads/safety-plans' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File Filter to allow only PDFs and images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only images (jpg, jpeg, png) and PDFs are allowed"));
};

// Upload Middleware
const upload = multer({ storage, fileFilter });

// Get all safety plans
const getAllSafetyPlans = async (req, res) => {
  try {
    const safetyPlans = await SafetyPlan.find().lean();
    if (!safetyPlans.length) {
      return res.status(404).json({ message: "No safety plans found" });
    }
    res.status(200).json(safetyPlans);
  } catch (error) {
    console.error("Error fetching safety plans:", error);
    res.status(500).json({ message: "Error fetching safety plans", error: error.message });
  }
};

// Get a single safety plan by ID
const getSafetyPlanById = async (req, res) => {
  try {
    const safetyPlan = await SafetyPlan.findById(req.params.id).lean();
    if (!safetyPlan) {
      return res.status(404).json({ message: "Safety plan not found" });
    }
    res.status(200).json(safetyPlan);
  } catch (error) {
    console.error("Error fetching safety plan:", error);
    res.status(500).json({ message: "Error fetching safety plan", error: error.message });
  }
};

// Create a new safety plan with file upload
const createSafetyPlan = async (req, res) => {
  try {
    const { hazardDetails, riskLevel, mitigationMeasures, status, createdBy } = req.body;

    if (!hazardDetails || !riskLevel || !mitigationMeasures || !createdBy) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Handle file upload
    const uploadedFile = req.file ? req.file.path : null;

    const safetyPlan = new SafetyPlan({
      hazardDetails,
      riskLevel,
      mitigationMeasures,
      status: status || "draft",
      createdBy,
      file: uploadedFile, // Store file path
    });

    await safetyPlan.save();
    res.status(201).json(safetyPlan);
  } catch (error) {
    console.error("Error creating safety plan:", error);
    res.status(500).json({ message: "Error creating safety plan", error: error.message });
  }
};

// Update an existing safety plan with file upload
const updateSafetyPlan = async (req, res) => {
  try {
    const { hazardDetails, riskLevel, mitigationMeasures, status, updatedBy } = req.body;

    if (!hazardDetails || !riskLevel || !mitigationMeasures || !updatedBy) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Handle file upload
    const uploadedFile = req.file ? req.file.path : null;

    const updatedData = {
      hazardDetails,
      riskLevel,
      mitigationMeasures,
      status,
      updatedBy,
    };

    if (uploadedFile) {
      updatedData.file = uploadedFile;
    }

    const safetyPlan = await SafetyPlan.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!safetyPlan) {
      return res.status(404).json({ message: "Safety plan not found" });
    }

    res.status(200).json(safetyPlan);
  } catch (error) {
    console.error("Error updating safety plan:", error);
    res.status(500).json({ message: "Error updating safety plan", error: error.message });
  }
};

// Delete a safety plan by ID
const deleteSafetyPlan = async (req, res) => {
  try {
    const safetyPlan = await SafetyPlan.findByIdAndDelete(req.params.id);
    if (!safetyPlan) {
      return res.status(404).json({ message: "Safety plan not found" });
    }

    res.status(200).json({ message: "Safety plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting safety plan:", error);
    res.status(500).json({ message: "Error deleting safety plan", error: error.message });
  }
};

export { 
  getAllSafetyPlans, 
  getSafetyPlanById, 
  createSafetyPlan, 
  updateSafetyPlan, 
  deleteSafetyPlan, 
  upload // Export the upload middleware to use in routes
};
