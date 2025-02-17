import Achievement from "../models/Achievement.js";

// Get all achievements
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Server Error" });
  }
};

// Create a new achievement
const createAchievement = async (req, res) => {
  try {
    if (!req.body.name || !req.body.description) {
      return res.status(400).json({ success: false, error: "Name and description are required" });
    }

    const newAchievement = new Achievement(req.body);
    await newAchievement.save();

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
import mongoose from "mongoose";

// Update an achievement
const updateAchievement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid achievement ID" });
    }

    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ success: false, error: "Achievement not found" });
    }

    const updatedAchievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({
      success: true,
      message: "Achievement updated successfully",
      data: updatedAchievement,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to update achievement" });
  }
};

// Delete an achievement
const deleteAchievement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid achievement ID" });
    }

    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({ success: false, error: "Achievement not found" });
    }

    await Achievement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Achievement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || "Failed to delete achievement" });
  }
};

export { getAchievements, createAchievement, updateAchievement, deleteAchievement };

