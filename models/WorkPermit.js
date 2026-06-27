import mongoose from 'mongoose';

const workPermitSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    permitNumber: { type: String, unique: true },
    workType: {
      type: String,
      enum: ['hot_work', 'confined_space', 'electrical', 'excavation', 'height_work', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: String,
    location: { area: String, level: String, latitude: Number, longitude: Number },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'expired', 'cancelled', 'completed'],
      default: 'pending',
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    hazards: [String],
    precautions: [String],
    equipmentRequired: [String],
    notes: String,
  },
  { timestamps: true }
);

workPermitSchema.pre('save', function (next) {
  if (!this.permitNumber) {
    this.permitNumber = `PTW-${Date.now().toString(36).toUpperCase()}`;
  }
  next();
});

workPermitSchema.index({ mineId: 1, status: 1 });
workPermitSchema.index({ validUntil: 1 });

export default mongoose.model('WorkPermit', workPermitSchema);
