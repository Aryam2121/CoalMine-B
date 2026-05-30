import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ["Present", "Absent"], default: "Absent" },
});

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });



// ✅ Prevent overwriting the model if it already exists
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);


export default Attendance;
