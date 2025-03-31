import mongoose from "mongoose";

const SafetyCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tasks: [
    {
      taskName: { type: String, required: true },
      completed: { type: Boolean, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  gpsHistory: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  signature: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const SafetyCheck = mongoose.model("SafetyCheck", SafetyCheckSchema);
export default SafetyCheck;
