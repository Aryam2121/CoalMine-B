// models/AuditLog.js
import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, required: true },
});

export default mongoose.model('AuditLog', AuditLogSchema);
