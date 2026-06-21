import ComplianceRecord from '../models/ComplianceRecord.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailUtils.js';

const MS_DAY = 24 * 60 * 60 * 1000;

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / MS_DAY);
};

const shouldSendReminder = (record, daysLeft) => {
  const thresholds = record.reminderDays?.length ? record.reminderDays : [30, 7, 1];
  if (!thresholds.includes(daysLeft) && daysLeft > 0) return false;
  if (daysLeft <= 0 && record.status !== 'expired' && record.status !== 'overdue') return false;

  if (record.lastReminderSent) {
    const hoursSince = (Date.now() - new Date(record.lastReminderSent).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) return false;
  }
  return daysLeft <= 30 || record.status === 'expired' || record.status === 'overdue';
};

export const processComplianceReminders = async () => {
  const records = await ComplianceRecord.find({
    status: { $in: ['valid', 'expiring_soon', 'expired', 'scheduled', 'overdue'] },
  }).populate('assignedTo', 'name email');

  let sent = 0;

  for (const record of records) {
    const targetDate = record.type === 'certificate' ? record.expiryDate : record.scheduledDate;
    const daysLeft = daysUntil(targetDate);
    if (daysLeft === null) continue;
    if (!shouldSendReminder(record, daysLeft)) continue;

    let recipient = record.assignedTo?.email;
    if (!recipient) {
      const admin = await User.findOne({ role: /admin|manager/i }).select('email');
      recipient = admin?.email;
    }
    if (!recipient) continue;

    const subject = `[Mine Manager] Compliance reminder: ${record.name}`;
    const text =
      record.type === 'certificate'
        ? `Certificate "${record.name}" expires in ${daysLeft} day(s) (${new Date(record.expiryDate).toDateString()}). Status: ${record.status}.`
        : `Inspection "${record.name}" is scheduled in ${daysLeft} day(s) (${new Date(record.scheduledDate).toDateString()}). Status: ${record.status}.`;

    const result = await sendEmail({ to: recipient, subject, text });
    if (result.sent) {
      record.lastReminderSent = new Date();
      await record.save();
      sent += 1;
    }
  }

  return { processed: records.length, sent };
};

export const startComplianceReminderScheduler = (intervalMs = 60 * 60 * 1000) => {
  const run = () => {
    processComplianceReminders().catch((err) =>
      console.error('[compliance-reminders]', err.message)
    );
  };
  run();
  return setInterval(run, intervalMs);
};

export default { processComplianceReminders, startComplianceReminderScheduler };
