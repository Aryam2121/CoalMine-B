import mongoose from "mongoose";

const CompilanceReportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Approved", "Pending", "Rejected"], required: true },
  details: { type: String, required: true },
}, { timestamps: true });

const CompilanceReport  = mongoose.model("CompilanceReport", CompilanceReportSchema);
export default CompilanceReport;
