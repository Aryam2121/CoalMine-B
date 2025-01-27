import mongoose from 'mongoose';

// Define the schema for maintenance tasks
const maintenanceSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      required: [true, 'Task is required'],  // Validation to ensure task is provided
      minlength: [5, 'Task name must be at least 5 characters long'],  // Custom validation for task name length
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],  // Validation to ensure date is provided
      default: Date.now,  // Default to current date if not provided
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],  // Restrict status to predefined values
      default: 'pending',  // Default value if not specified
    },
    description: {
      type: String,
      maxlength: [500, 'Description must be less than 500 characters'],  // Limit description length
    },
    priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [5, 'Priority must be at most 5'],
      default: 3,  // Default priority is 3
    },
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// Create an index on the date field for faster queries on tasks by date
maintenanceSchema.index({ date: 1 });

// Create the model for Maintenance
const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
