import mongoose from 'mongoose';

// Define the schema for SafetyPlan
const SafetyPlanSchema = new mongoose.Schema(
  {
    hazardDetails: {
      type: String,
      required: [true, 'Hazard details are required'],  // Validation for required field
      minlength: [10, 'Hazard details must be at least 10 characters long'],  // Minimum length
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],  // Validation for risk level
      enum: ['low', 'medium', 'high'],  // Enum validation for risk level
      default: 'medium',  // Default value if not provided
    },
    mitigationMeasures: {
      type: String,
      required: [true, 'Mitigation measures are required'],  // Validation for mitigation measures
      minlength: [10, 'Mitigation measures must be at least 10 characters long'],  // Minimum length
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],  // Enum validation for status
      default: 'draft',  // Default value if not provided
    },
    createdBy: {
      type: String,
      required: [true, 'Created by field is required'],  // Validation for createdBy field
    },
    updatedBy: {
      type: String,
      required: false,  // Optional field for tracking the user who last updated
    },
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// Index on status field for better query performance (optional, if querying by status frequently)
SafetyPlanSchema.index({ status: 1 });

// Create and export the SafetyPlan model
const SafetyPlan = mongoose.model('SafetyPlan', SafetyPlanSchema);
export default SafetyPlan;
