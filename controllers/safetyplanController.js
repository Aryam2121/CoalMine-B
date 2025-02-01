import SafetyPlan from "../models/SafetyPlanModel.js";

// Get all safety plans
const getAllSafetyPlans = async (req, res) => {
  try {
    const safetyPlans = await SafetyPlan.find();
    if (safetyPlans.length === 0) {
      return res.status(404).json({ message: "No safety plans found" });
    }
    res.status(200).json(safetyPlans);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error fetching safety plans", error: error.message });
  }
};

// Get a single safety plan by ID
const getSafetyPlanById = async (req, res) => {
  try {
    const safetyPlan = await SafetyPlan.findById(req.params.id);
    if (!safetyPlan) {
      return res.status(404).json({ message: "Safety plan not found" });
    }
    res.status(200).json(safetyPlan);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error fetching safety plan", error: error.message });
  }
};

// Create a new safety plan
const createSafetyPlan = async (req, res) => {
  try {
    const { hazardDetails, riskLevel, mitigationMeasures, status, createdBy } = req.body;

    // Validate required fields
    if (!hazardDetails || !riskLevel || !mitigationMeasures || !createdBy) {
      return res.status(400).json({ message: "Hazard details, risk level, mitigation measures, and created by are required" });
    }

    // Create a new safety plan
    const safetyPlan = new SafetyPlan({
      hazardDetails,
      riskLevel,
      mitigationMeasures,
      status: status || 'draft',  // Default to 'draft' if not provided
      createdBy,
    });

    await safetyPlan.save();
    res.status(201).json(safetyPlan);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error creating safety plan", error: error.message });
  }
};

// Update an existing safety plan
const updateSafetyPlan = async (req, res) => {
  try {
    const { hazardDetails, riskLevel, mitigationMeasures, status, updatedBy } = req.body;

    // Validate required fields
    if (!hazardDetails || !riskLevel || !mitigationMeasures || !updatedBy) {
      return res.status(400).json({ message: "Hazard details, risk level, mitigation measures, and updated by are required" });
    }

    const safetyPlan = await SafetyPlan.findByIdAndUpdate(
      req.params.id,
      { hazardDetails, riskLevel, mitigationMeasures, status, updatedBy },
      { new: true }  // Return the updated document
    );

    if (!safetyPlan) {
      return res.status(404).json({ message: "Safety plan not found" });
    }

    res.status(200).json(safetyPlan);
  } catch (error) {
    console.error(error);  // Log error for debugging
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
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error deleting safety plan", error: error.message });
  }
};
export  { getAllSafetyPlans, getSafetyPlanById, createSafetyPlan, updateSafetyPlan, deleteSafetyPlan };