// models/Achievement.js
import mongoose from "mongoose";

const AchievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  target: { type: Number, required: true },
  progressKey: { type: String, required: true },
  milestone: { type: String },
});
const Achievement = mongoose.model("Achievement", AchievementSchema);
export default Achievement;