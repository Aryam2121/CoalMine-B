import mongoose from 'mongoose';

// Define the schema for maintenance tasks
const maintenanceSchema = new mongoose.Schema(
  {
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true
    },
    task: {
      type: String,
      required: [true, 'Task is required'],
      minlength: [5, 'Task name must be at least 5 characters long'],
      trim: true
    },
    equipmentId: {
      type: String,
      index: true
    },
    equipmentName: String,
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled', 'overdue'],
      default: 'pending',
    },
    description: {
      type: String,
      maxlength: [500, 'Description must be less than 500 characters'],
    },
    priority: {
      type: Number,
      min: [1, 'Priority must be at least 1'],
      max: [5, 'Priority must be at most 5'],
      default: 3,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    category: {
      type: String,
      enum: ['preventive', 'corrective', 'predictive', 'emergency'],
      default: 'preventive'
    },
    estimatedDuration: Number, // in hours
    actualDuration: Number, // in hours
    cost: {
      estimated: { type: Number, default: 0 },
      actual: { type: Number, default: 0 }
    },
    parts: [{
      partName: String,
      quantity: Number,
      cost: Number
    }],
    notes: [{
      note: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now }
    }],
    attachments: [{
      filename: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    recurringSchedule: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
      nextScheduledDate: Date
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if task is overdue
maintenanceSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && this.dueDate < new Date();
});

// Pre-save middleware to update status if overdue
maintenanceSchema.pre('save', function(next) {
  if (this.status !== 'completed' && this.status !== 'cancelled' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  if (this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

// Method to complete task
maintenanceSchema.methods.complete = function(actualDuration, actualCost, completionNotes) {
  this.status = 'completed';
  this.completedDate = new Date();
  if (actualDuration) this.actualDuration = actualDuration;
  if (actualCost) this.cost.actual = actualCost;
  if (completionNotes) {
    this.notes.push({ note: completionNotes });
  }
  return this.save();
};

// Static method to get overdue tasks
maintenanceSchema.statics.getOverdueTasks = function(mineId) {
  return this.find({
    mineId,
    status: { $in: ['pending', 'in-progress', 'overdue'] },
    dueDate: { $lt: new Date() }
  }).sort({ priority: -1, dueDate: 1 });
};

// Create indexes for faster queries
maintenanceSchema.index({ date: 1 });
maintenanceSchema.index({ status: 1, priority: -1 });
maintenanceSchema.index({ mineId: 1, status: 1 });

// Create the model for Maintenance
const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
