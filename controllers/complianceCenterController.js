import ComplianceRecord from '../models/ComplianceRecord.js';

const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};

export const getComplianceRecords = async (req, res) => {
  try {
    const { type, mineId, status } = req.query;
    const query = {};
    if (type) query.type = type;
    if (mineId) query.mineId = mineId;
    if (status) query.status = status;

    const records = await ComplianceRecord.find(query)
      .sort({ expiryDate: 1, scheduledDate: 1 })
      .populate('assignedTo', 'name email');

    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplianceRecord = async (req, res) => {
  try {
    const record = new ComplianceRecord({ ...req.body });
    await record.save();
    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplianceRecord = async (req, res) => {
  try {
    const record = await ComplianceRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComplianceRecord = async (req, res) => {
  try {
    const record = await ComplianceRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComplianceReminders = async (req, res) => {
  try {
    const records = await ComplianceRecord.find({
      status: { $in: ['expiring_soon', 'expired', 'overdue', 'scheduled'] },
    }).populate('assignedTo', 'name email');

    const reminders = records.map((r) => ({
      _id: r._id,
      name: r.name,
      type: r.type,
      status: r.status,
      daysUntil: r.type === 'certificate' ? daysUntil(r.expiryDate) : daysUntil(r.scheduledDate),
      expiryDate: r.expiryDate,
      scheduledDate: r.scheduledDate,
      assignedTo: r.assignedTo,
    }));

    res.json({ success: true, reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getComplianceRecords, createComplianceRecord, updateComplianceRecord, deleteComplianceRecord, getComplianceReminders };
