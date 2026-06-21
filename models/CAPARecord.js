import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedToName: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'verified'],
      default: 'pending',
    },
    completedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationNotes: String,
  },
  { timestamps: true }
);

const capaSchema = new mongoose.Schema(
  {
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SafetyReport' },
    mineId: { type: mongoose.Schema.Types.ObjectId, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    rootCause: String,
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'verification', 'closed'],
      default: 'open',
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correctiveActions: [actionSchema],
    preventiveActions: [actionSchema],
    closedAt: Date,
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closureNotes: String,
  },
  { timestamps: true }
);

capaSchema.index({ status: 1, createdAt: -1 });

const CAPARecord = mongoose.model('CAPARecord', capaSchema);
export default CAPARecord;
