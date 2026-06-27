import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    equipmentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    manufacturer: String,
    model: String,
    serialNumber: String,
    installDate: Date,
    location: { area: String, level: String, latitude: Number, longitude: Number },
    criticality: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: {
      type: String,
      enum: ['operational', 'warning', 'malfunction', 'offline', 'maintenance', 'decommissioned'],
      default: 'operational',
    },
    lastMaintenance: Date,
    nextMaintenance: Date,
    failureCount: { type: Number, default: 0 },
    notes: String,
    qrCode: String,
  },
  { timestamps: true }
);

equipmentSchema.index({ mineId: 1, equipmentId: 1 }, { unique: true });
equipmentSchema.index({ mineId: 1, status: 1 });

export default mongoose.model('Equipment', equipmentSchema);
