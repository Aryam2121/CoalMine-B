// controllers/auditLogController.js
import AuditLog from"../models/Audit.js";

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const { user, action, details } = req.body;
    const newLog = new AuditLog({ user, action, details });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
