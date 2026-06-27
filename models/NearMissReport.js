import mongoose from 'mongoose';

const nearMissSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    anonymous: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['fall', 'equipment', 'gas', 'electrical', 'structural', 'vehicle', 'ppe', 'other'],
      default: 'other',
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    location: { area: String, level: String, latitude: Number, longitude: Number },
    photoUrl: String,
    voiceNoteUrl: String,
    status: { type: String, enum: ['submitted', 'reviewing', 'actioned', 'closed'], default: 'submitted' },
    capaId: { type: mongoose.Schema.Types.ObjectId, ref: 'CAPARecord' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: String,
  },
  { timestamps: true }
);

nearMissSchema.index({ mineId: 1, status: 1, createdAt: -1 });

export default mongoose.model('NearMissReport', nearMissSchema);
