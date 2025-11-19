import mongoose from 'mongoose';

// Real-Time Monitoring System Schema
const realTimeMonitoringSchema = new mongoose.Schema(
  {
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    activePersonnel: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: String,
        role: String,
        location: {
          latitude: Number,
          longitude: Number,
          area: String,
          level: String,
        },
        status: {
          type: String,
          enum: ['active', 'idle', 'on_break', 'emergency', 'offline'],
        },
        lastUpdate: Date,
        vitalSigns: {
          heartRate: Number,
          bodyTemperature: Number,
          oxygenLevel: Number,
          stressLevel: String,
        },
      },
    ],
    equipmentStatus: [
      {
        equipmentId: String,
        name: String,
        type: String,
        status: {
          type: String,
          enum: ['operational', 'warning', 'malfunction', 'offline', 'maintenance'],
        },
        location: String,
        metrics: {
          temperature: Number,
          vibration: Number,
          pressure: Number,
          fuelLevel: Number,
          runtime: Number,
        },
        lastMaintenance: Date,
        alerts: [String],
      },
    ],
    environmentalConditions: {
      gasLevels: {
        methane: Number,
        carbonMonoxide: Number,
        carbonDioxide: Number,
        oxygen: Number,
        hydrogenSulfide: Number,
      },
      airQuality: {
        particulateMatter: Number,
        dustLevel: Number,
        visibility: String,
      },
      temperature: Number,
      humidity: Number,
      pressure: Number,
      ventilation: {
        airflow: Number,
        status: String,
      },
    },
    structuralHealth: {
      roofSupport: [
        {
          location: String,
          pressure: Number,
          status: String,
        },
      ],
      wallStability: [
        {
          location: String,
          displacement: Number,
          status: String,
        },
      ],
      floodingRisk: {
        waterLevel: Number,
        drainageStatus: String,
      },
    },
    powerSystems: {
      mainPowerStatus: String,
      backupPowerStatus: String,
      currentLoad: Number,
      maxCapacity: Number,
      utilizationRate: Number,
    },
    communicationSystems: {
      radioNetwork: String,
      emergencyAlarms: String,
      paSystem: String,
      connectivity: Number,
    },
    alerts: [
      {
        alertType: String,
        severity: {
          type: String,
          enum: ['info', 'warning', 'critical', 'emergency'],
        },
        message: String,
        location: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        acknowledged: Boolean,
        acknowledgedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    operationalMetrics: {
      currentProduction: Number,
      targetProduction: Number,
      efficiency: Number,
      activeEquipment: Number,
      activeWorkers: Number,
    },
  },
  {
    timestamps: true,
    // Auto-delete old monitoring data after 30 days
    expireAfterSeconds: 30 * 24 * 60 * 60,
  }
);

// Indexes
realTimeMonitoringSchema.index({ mineId: 1, timestamp: -1 });
realTimeMonitoringSchema.index({ 'alerts.severity': 1 });

// Static method to get current status
realTimeMonitoringSchema.statics.getCurrentStatus = function (mineId) {
  return this.findOne({ mineId })
    .sort({ timestamp: -1 })
    .populate('mineId');
};

// Method to add alert
realTimeMonitoringSchema.methods.addAlert = function (alertData) {
  this.alerts.push({
    ...alertData,
    timestamp: new Date(),
    acknowledged: false,
  });
  return this.save();
};

const RealTimeMonitoring = mongoose.model('RealTimeMonitoring', realTimeMonitoringSchema);

export default RealTimeMonitoring;
