import mongoose from "mongoose";
import Achievement from "../models/Achievement.js";

// Get all achievements
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Server Error" });
  }
};

// Create a new achievement
const createAchievement = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, error: "Name and description are required" });
    }

    const newAchievement = await Achievement.create({ name, description });
    res.status(201).json({
      success: true,
      message: "Achievement created successfully",
      data: newAchievement,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to create achievement" });
  }
};

// Update an achievement
const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressKey, progress } = req.body;

    console.log("📌 Incoming request to update achievement:", { id, progressKey, progress });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid achievement ID" });
    }

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      console.log("🚨 Achievement Not Found in DB");
      return res.status(404).json({ success: false, error: "Achievement not found" });
    }

    // Dynamically update only the progress field
    const updatedAchievement = await Achievement.findByIdAndUpdate(
      id,
      { [progressKey]: progress },
      { new: true, runValidators: true }
    );

    if (!updatedAchievement) {
      return res.status(404).json({ success: false, error: "Achievement not found after update" });
    }

    console.log("✅ Achievement Updated Successfully:", updatedAchievement);

    res.status(200).json({ success: true, data: updatedAchievement });

  } catch (error) {
    console.error("🚨 Update Achievement Error:", error);
    res.status(500).json({ success: false, error: "Failed to update achievement" });
  }
};


// Delete an achievement
const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid achievement ID" });
    }

    const achievement = await Achievement.findByIdAndDelete(id);
    if (!achievement) {
      return res.status(404).json({ success: false, error: "Achievement not found" });
    }

    res.status(200).json({ success: true, message: "Achievement deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to delete achievement" });
  }
};

export { getAchievements, createAchievement, updateAchievement, deleteAchievement };
