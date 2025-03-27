import mongoose from 'mongoose';

// Define the schema for ShiftLog
const ShiftLogSchema = new mongoose.Schema(
  {
    shiftDetails: {
      type: String,
      required: [true, 'Shift details are required'], 
      minlength: [10, 'Shift details must be at least 10 characters long'], 
    },
    shiftDate: {
      type: Date,
      required: [true, 'Shift date is required'],
    },
    shiftStartTime: {
      type: String, // Time format could be 'HH:mm'
      required: [true, 'Shift start time is required'], 
    },
    shiftEndTime: {
      type: String, // Time format could be 'HH:mm'
      required: [true, 'Shift end time is required'], 
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'in-progress'],
      default: 'pending', 
    },
    notes: {
      type: String,
      required: false, // Optional field for any additional notes on the shift
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index on shiftDate for better query performance
ShiftLogSchema.index({ shiftDate: 1 });
// Create and export the ShiftLog model
const ShiftLog = mongoose.model('ShiftLog', ShiftLogSchema);
export default ShiftLog;