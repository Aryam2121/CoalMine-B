import mongoose from 'mongoose';

// Advanced Analytics Dashboard Schema
const advancedAnalyticsSchema = new mongoose.Schema(
  {
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true,
    },
    period: {
      start: Date,
      end: Date,
    },
    productivity: {
      totalProduction: Number,
      productionTarget: Number,
      achievementRate: Number,
      trendsAnalysis: {
        comparedToPreviousPeriod: Number,
        growthRate: Number,
        prediction: Number,
      },
      byShift: [
        {
          shiftName: String,
          production: Number,
          efficiency: Number,
        },
      ],
      byArea: [
        {
          areaName: String,
          production: Number,
          efficiency: Number,
        },
      ],
    },
    safety: {
      incidentCount: Number,
      incidentRate: Number,
      nearMissCount: Number,
      daysWithoutIncident: Number,
      safetyScore: Number,
      complianceRate: Number,
      byCategory: [
        {
          category: String,
          count: Number,
          severity: String,
        },
      ],
      trends: {
        improving: Boolean,
        percentageChange: Number,
      },
    },
    workforce: {
      totalEmployees: Number,
      activeEmployees: Number,
      attendanceRate: Number,
      absenteeismRate: Number,
      averageExperience: Number,
      trainingCompletionRate: Number,
      byRole: [
        {
          role: String,
          count: Number,
          attendanceRate: Number,
        },
      ],
      performanceMetrics: {
        averageProductivity: Number,
        safetyCompliance: Number,
        taskCompletionRate: Number,
      },
    },
    equipment: {
      totalEquipment: Number,
      operationalEquipment: Number,
      underMaintenance: Number,
      utilization: Number,
      downtime: Number,
      maintenanceCost: Number,
      byType: [
        {
          equipmentType: String,
          count: Number,
          utilizationRate: Number,
          failureRate: Number,
        },
      ],
    },
    financial: {
      operatingCost: Number,
      revenue: Number,
      profitMargin: Number,
      costPerTon: Number,
      breakdownByCategory: [
        {
          category: String,
          amount: Number,
          percentage: Number,
        },
      ],
    },
    environmental: {
      emissionsLevel: Number,
      waterUsage: Number,
      wasteGenerated: Number,
      complianceStatus: String,
      improvementAreas: [String],
    },
    kpi: [
      {
        name: String,
        value: Number,
        target: Number,
        unit: String,
        status: {
          type: String,
          enum: ['on_track', 'at_risk', 'off_track'],
        },
        trend: String,
      },
    ],
    insights: [
      {
        category: String,
        insight: String,
        priority: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low'],
        },
        actionItems: [String],
      },
    ],
    benchmarking: {
      industryAverage: Number,
      rankingPercentile: Number,
      bestPractices: [String],
      improvementOpportunities: [String],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    exportedFormats: [
      {
        format: String,
        exportedAt: Date,
        fileUrl: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
advancedAnalyticsSchema.index({ mineId: 1, reportDate: -1 });
advancedAnalyticsSchema.index({ reportType: 1 });

// Static method to get latest report
advancedAnalyticsSchema.statics.getLatestReport = function (mineId, reportType) {
  return this.findOne({ mineId, reportType })
    .sort({ reportDate: -1 })
    .populate('mineId generatedBy');
};

const AdvancedAnalytics = mongoose.model('AdvancedAnalytics', advancedAnalyticsSchema);

export default AdvancedAnalytics;
