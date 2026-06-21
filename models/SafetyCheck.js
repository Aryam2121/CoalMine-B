import mongoose from "mongoose";

const SafetyCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  mineId: { type: mongoose.Schema.Types.ObjectId, index: true },
  shiftDate: { type: Date, default: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }},
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
  images: [{ url: String, filename: String, uploadedAt: { type: Date, default: Date.now } }],
  signature: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

SafetyCheckSchema.index({ userId: 1, shiftDate: 1 });

const SafetyCheck = mongoose.model("SafetyCheck", SafetyCheckSchema);
export default SafetyCheck;
