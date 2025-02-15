import Achievement from "../models/Achievement.js";

const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

// Create a new achievement
const createAchievement = async (req, res) => {
  try {
    const newAchievement = new Achievement(req.body);
    await newAchievement.save();
    res.status(201).json(newAchievement);
  } catch (error) {
    res.status(500).json({ error: "Failed to create achievement" });
  }
};

// Update an achievement
const updateAchievement = async (req, res) => {
  try {
    const updatedAchievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedAchievement);
  } catch (error) {
    res.status(500).json({ error: "Failed to update achievement" });
  }
};

// Delete an achievement
const deleteAchievement = async (req, res) => {
  try {
    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ message: "Achievement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete achievement" });
  }
};
export default {getAchievements,createAchievement,updateAchievement,deleteAchievement};