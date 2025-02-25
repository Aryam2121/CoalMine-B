import mongoose from "mongoose";

const SafetyReportSchema = new mongoose.Schema(
  {
    reportTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attachments: {
      type: [String], // Array of file paths for attachments
      default: [],
    },
  },
  { timestamps: true }
);

const SafetyReport = mongoose.model("SafetyReport", SafetyReportSchema);

export default SafetyReport;
