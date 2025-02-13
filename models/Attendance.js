import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, enum: ["Mining", "Maintenance"], required: true },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" },
});

const Attendance =  mongoose.model("Attendance", AttendanceSchema);
export default Attendance;