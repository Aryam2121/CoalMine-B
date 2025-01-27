import mongoose from 'mongoose';

// Define the schema for ShiftLog
const ShiftLogSchema = new mongoose.Schema(
  {
    shiftDetails: {
      type: String,
      required: [true, 'Shift details are required'], // Ensuring that shift details are provided
      minlength: [10, 'Shift details must be at least 10 characters long'], // Minimum length for shift details
    },
    shiftDate: {
      type: Date,
      required: [true, 'Shift date is required'], // Ensuring the date of the shift is required
    },
    shiftStartTime: {
      type: String, // Time format could be 'HH:mm'
      required: [true, 'Shift start time is required'], // Ensuring the shift start time is provided
    },
    shiftEndTime: {
      type: String, // Time format could be 'HH:mm'
      required: [true, 'Shift end time is required'], // Ensuring the shift end time is provided
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker', // Assuming a Worker model exists, this establishes a relationship with the worker
      required: [true, 'Worker ID is required'], // Ensuring the worker ID is provided
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'in-progress'], // Status options for shift log
      default: 'pending', // Default value for status if not provided
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

// Index on shiftDate and workerId for better performance when querying
ShiftLogSchema.index({ shiftDate: 1, workerId: 1 });

// Create and export the ShiftLog model
const ShiftLog = mongoose.model('ShiftLog', ShiftLogSchema);
export default ShiftLog;
