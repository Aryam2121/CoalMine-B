import mongoose from 'mongoose';

// Incident Prediction Model using historical data patterns
const incidentPredictionSchema = new mongoose.Schema(
  {
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true,
    },
    predictionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    predictionWindow: {
      start: Date,
      end: Date,
    },
    patterns: {
      timeOfDay: {
        highRiskHours: [Number],
        peakIncidentHour: Number,
      },
      dayOfWeek: {
        highRiskDays: [String],
        peakIncidentDay: String,
      },
      seasonalTrends: {
        highRiskMonths: [String],
        weatherCorrelation: String,
      },
    },
    riskFactors: [
      {
        factor: String,
        weight: Number,
        currentValue: Number,
        threshold: Number,
        status: {
          type: String,
          enum: ['normal', 'caution', 'warning', 'critical'],
        },
      },
    ],
    historicalComparison: {
      similarIncidentsPast: Number,
      averageTimeBetweenIncidents: Number,
      daysSinceLastIncident: Number,
      trendDirection: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
      },
    },
    mlPredictions: {
      incidentProbability: {
        type: Number,
        min: 0,
        max: 100,
      },
      confidenceLevel: {
        type: Number,
        min: 0,
        max: 100,
      },
      predictedType: String,
      predictedSeverity: String,
      contributingFactors: [String],
    },
    preventiveMeasures: [
      {
        measure: String,
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
        },
        implementationCost: Number,
        effectivenessScore: Number,
        estimatedRiskReduction: Number,
        deadline: Date,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'overdue'],
          default: 'pending',
        },
      },
    ],
    alertsSent: [
      {
        recipient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sentAt: Date,
        acknowledged: Boolean,
        acknowledgedAt: Date,
      },
    ],
    accuracy: {
      predictionAccurate: Boolean,
      actualOutcome: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
incidentPredictionSchema.index({ mineId: 1, predictionDate: -1 });
incidentPredictionSchema.index({ 'mlPredictions.incidentProbability': -1 });

// Static method to get high-risk predictions
incidentPredictionSchema.statics.getHighRiskPredictions = function (threshold = 70) {
  return this.find({ 'mlPredictions.incidentProbability': { $gte: threshold } })
    .sort({ 'mlPredictions.incidentProbability': -1 })
    .populate('mineId');
};

const IncidentPrediction = mongoose.model('IncidentPrediction', incidentPredictionSchema);

export default IncidentPrediction;
