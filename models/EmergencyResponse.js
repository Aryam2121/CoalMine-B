import mongoose from 'mongoose';

// Emergency Response Schema for SOS and crisis management
const emergencyResponseSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: String,
      unique: true,
      required: true,
      default: () => `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    mineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mine',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emergencyType: {
      type: String,
      enum: [
        'fire',
        'explosion',
        'gas_leak',
        'collapse',
        'flooding',
        'equipment_failure',
        'injury',
        'entrapment',
        'power_failure',
        'other',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'critical', 'catastrophic'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'responding', 'contained', 'resolved', 'false_alarm'],
      default: 'active',
    },
    location: {
      latitude: Number,
      longitude: Number,
      area: String,
      level: String,
      coordinates: String,
    },
    description: {
      type: String,
      required: true,
    },
    affectedPersonnel: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['safe', 'injured', 'missing', 'evacuated', 'unknown'],
        },
        lastKnownLocation: String,
      },
    ],
    responseTeam: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['coordinator', 'responder', 'medic', 'engineer', 'safety_officer'],
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        status: String,
      },
    ],
    timeline: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        event: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: String,
      },
    ],
    evacuationStatus: {
      initiated: Boolean,
      completedAt: Date,
      personnelEvacuated: Number,
      personnelRemaining: Number,
      evacuationRoutes: [String],
    },
    resources: {
      deployed: [
        {
          resourceType: String,
          quantity: Number,
          deployedAt: Date,
        },
      ],
      required: [
        {
          resourceType: String,
          quantity: Number,
          priority: String,
        },
      ],
    },
    communicationLog: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        channel: String,
      },
    ],
    attachments: [
      {
        fileUrl: String,
        fileType: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: String,
    postIncidentReport: {
      rootCause: String,
      contributingFactors: [String],
      lessonsLearned: String,
      preventiveMeasures: [String],
      estimatedDamage: Number,
      downtime: Number,
    },
    notifications: {
      authoritiesNotified: Boolean,
      authoritiesNotifiedAt: Date,
      externalAgenciesContacted: [String],
      mediaAlerted: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimized queries
emergencyResponseSchema.index({ mineId: 1, status: 1 });
emergencyResponseSchema.index({ createdAt: -1 });
emergencyResponseSchema.index({ severity: 1 });

// Static method to get active emergencies
emergencyResponseSchema.statics.getActiveEmergencies = function () {
  return this.find({ status: { $in: ['active', 'responding'] } })
    .sort({ severity: -1, createdAt: -1 })
    .populate('mineId reportedBy');
};

// Instance method to add timeline event
emergencyResponseSchema.methods.addTimelineEvent = function (event, performedBy, notes) {
  this.timeline.push({
    timestamp: new Date(),
    event,
    performedBy,
    notes,
  });
  return this.save();
};

// Instance method to update status
emergencyResponseSchema.methods.updateStatus = function (newStatus, userId) {
  this.status = newStatus;
  this.timeline.push({
    timestamp: new Date(),
    event: `Status changed to ${newStatus}`,
    performedBy: userId,
  });
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
    this.resolvedBy = userId;
  }
  
  return this.save();
};

const EmergencyResponse = mongoose.model('EmergencyResponse', emergencyResponseSchema);

export default EmergencyResponse;
