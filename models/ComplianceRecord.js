import mongoose from 'mongoose';

const complianceRecordSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, index: true },
    type: {
      type: String,
      enum: ['certificate', 'inspection'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: String,
    issuingAuthority: String,
    certificateNumber: String,
    expiryDate: Date,
    scheduledDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['valid', 'expiring_soon', 'expired', 'scheduled', 'completed', 'overdue'],
      default: 'valid',
    },
    reminderDays: { type: [Number], default: [30, 7, 1] },
    lastReminderSent: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [String],
  },
  { timestamps: true }
);

complianceRecordSchema.pre('save', function updateStatus(next) {
  const now = new Date();
  if (this.type === 'certificate' && this.expiryDate) {
    const daysLeft = (this.expiryDate - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) this.status = 'expired';
    else if (daysLeft <= 30) this.status = 'expiring_soon';
    else this.status = 'valid';
  }
  if (this.type === 'inspection' && this.scheduledDate && !this.completedDate) {
    if (this.scheduledDate < now) this.status = 'overdue';
    else this.status = 'scheduled';
  }
  if (this.completedDate) this.status = 'completed';
  next();
});

const ComplianceRecord = mongoose.model('ComplianceRecord', complianceRecordSchema);
export default ComplianceRecord;
