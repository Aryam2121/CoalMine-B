import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User model
  name: { type: String, required: true },
  department: { type: String, enum: ["Mining", "Maintenance"], required: true },
  date: { type: String, required: true }, // Date as a string (YYYY-MM-DD)
  status: { type: String, enum: ["Present", "Absent"], default: "Absent" },
});



// ✅ Prevent overwriting the model if it already exists
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);


export default Attendance;
