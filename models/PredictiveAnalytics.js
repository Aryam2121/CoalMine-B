import mongoose from 'mongoose';

// Predictive Analytics Schema for AI-powered safety predictions
const predictiveAnalyticsSchema = new mongoose.Schema(
  {
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true,
    },
    analysisDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    predictedIncidents: [
      {
        type: {
          type: String,
          enum: ['equipment_failure', 'gas_leak', 'structural_collapse', 'fire', 'flooding', 'other'],
        },
        probability: {
          type: Number,
          min: 0,
          max: 100,
        },
        estimatedTimeframe: {
          type: String,
          enum: ['immediate', 'within_24h', 'within_week', 'within_month'],
        },
        affectedArea: String,
        recommendedActions: [String],
      },
    ],
    factors: {
      weatherConditions: {
        temperature: Number,
        humidity: Number,
        rainfall: Number,
        windSpeed: Number,
      },
      operationalFactors: {
        hoursOperated: Number,
        maintenanceOverdue: Number,
        staffFatigue: Number,
        equipmentAge: Number,
      },
      historicalData: {
        pastIncidents: Number,
        daysWithoutIncident: Number,
        averageResponseTime: Number,
      },
    },
    recommendations: [
      {
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
        },
        action: String,
        estimatedCost: Number,
        estimatedTimeToImplement: String,
        potentialRiskReduction: Number,
      },
    ],
    mlModelVersion: {
      type: String,
      default: '1.0.0',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    alerts: [
      {
        alertType: String,
        severity: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized queries
predictiveAnalyticsSchema.index({ mineId: 1, analysisDate: -1 });
predictiveAnalyticsSchema.index({ riskLevel: 1 });

// Static method to get high-risk mines
predictiveAnalyticsSchema.statics.getHighRiskMines = function () {
  return this.find({ riskLevel: { $in: ['high', 'critical'] } })
    .sort({ riskScore: -1 })
    .populate('mineId');
};

// Instance method to check if immediate action is required
predictiveAnalyticsSchema.methods.requiresImmediateAction = function () {
  return (
    this.riskLevel === 'critical' ||
    this.predictedIncidents.some((incident) => incident.estimatedTimeframe === 'immediate')
  );
};

const PredictiveAnalytics = mongoose.model('PredictiveAnalytics', predictiveAnalyticsSchema);

export default PredictiveAnalytics;
