import mongoose from 'mongoose';

const hazardZoneSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    name: { type: String, required: true, trim: true },
    zoneType: {
      type: String,
      enum: ['restricted', 'gas_prone', 'blasting', 'unstable_roof', 'evacuation_route', 'muster_point'],
      default: 'restricted',
    },
    status: { type: String, enum: ['clear', 'restricted', 'evacuation', 'closed'], default: 'restricted' },
    center: { latitude: { type: Number, required: true }, longitude: { type: Number, required: true } },
    radiusMeters: { type: Number, default: 100 },
    polygon: [[Number]],
    maxOccupancy: Number,
    requiresAuthorization: { type: Boolean, default: true },
    authorizedRoles: [String],
    alertMessage: String,
    sensorThresholds: {
      methane: Number,
      carbonMonoxide: Number,
      temperature: Number,
    },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

hazardZoneSchema.index({ mineId: 1, active: 1 });

export default mongoose.model('HazardZone', hazardZoneSchema);
