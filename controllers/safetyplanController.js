import SafetyPlan from "../models/SafetyPlanModel.js";



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


// Create a new safety plan with file upload
const createSafetyPlan = async (req, res) => {
    try {
      console.log("Request received:", req.body);
      console.log("Uploaded file:", req.file);
  
      const { hazardDetails, riskLevel, mitigationMeasures, status, createdBy } = req.body;
  
      if (!hazardDetails || !riskLevel || !mitigationMeasures || !createdBy) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
  
      if (!req.file || !req.file.path) {
        return res.status(400).json({ message: "File upload failed" });
      }
  
      const imageUrl = req.file.path; // ✅ This will now be a Cloudinary URL
  
      const safetyPlan = new SafetyPlan({
        hazardDetails,
        riskLevel,
        mitigationMeasures,
        status: status || "draft",
        createdBy,
        file: imageUrl,
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

export { getAllSafetyPlans,  createSafetyPlan, updateSafetyPlan, deleteSafetyPlan};