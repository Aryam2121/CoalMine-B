import mongoose from 'mongoose';

const safetyDrillSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    title: { type: String, required: true, trim: true },
    drillType: {
      type: String,
      enum: ['fire', 'gas', 'evacuation', 'collapse', 'medical', 'communication'],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
    musterPoints: [{ name: String, latitude: Number, longitude: Number }],
    assignedRoles: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String }],
    objectives: [String],
    results: {
      responseTimeMinutes: Number,
      personnelAccounted: Number,
      personnelTotal: Number,
      issuesFound: [String],
      score: Number,
      notes: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

safetyDrillSchema.index({ mineId: 1, scheduledDate: 1 });

export default mongoose.model('SafetyDrill', safetyDrillSchema);
