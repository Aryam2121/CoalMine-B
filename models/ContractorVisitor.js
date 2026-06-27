import mongoose from 'mongoose';

const contractorVisitorSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mine', required: true },
    type: { type: String, enum: ['contractor', 'visitor'], default: 'visitor' },
    name: { type: String, required: true, trim: true },
    company: String,
    phone: String,
    email: String,
    badgeNumber: String,
    purpose: String,
    hostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkInAt: { type: Date, default: Date.now },
    checkOutAt: Date,
    status: { type: String, enum: ['checked_in', 'checked_out', 'overdue'], default: 'checked_in' },
    safetyBriefingCompleted: { type: Boolean, default: false },
    briefingItems: [{ item: String, completed: Boolean }],
    ppeIssued: [String],
    accessZones: [String],
    emergencyContact: String,
    photoUrl: String,
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contractorVisitorSchema.index({ mineId: 1, status: 1 });
contractorVisitorSchema.index({ checkInAt: -1 });

export default mongoose.model('ContractorVisitor', contractorVisitorSchema);
