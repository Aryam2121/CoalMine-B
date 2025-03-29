import mongoose from 'mongoose';

// Define the schema for ShiftLog
const ShiftLogSchema = new mongoose.Schema(
  {
    shiftDetails: {
      type: String,
      required: false, // ✅ Fix: Just use `false` without an array
      minlength: [10, 'Shift details must be at least 10 characters long'],
    },
    shiftStartTime: {
      type: String, 
      required: false, // ✅ Fix: Just `false`
    },
    shiftEndTime: {
      type: String, 
      required: false, // ✅ Fix: Just `false`
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'in-progress'],
      default: 'pending',
    },
    notes: {
      type: String,
      required: false, // ✅ Fix: Just `false`
    },
  },
  {
    timestamps: false, // Automatically adds createdAt and updatedAt fields
  }
);

// Create and export the ShiftLog model
const ShiftLog = mongoose.model('ShiftLog', ShiftLogSchema);
export default ShiftLog;
