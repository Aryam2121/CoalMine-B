import mongoose from 'mongoose';
import CAPARecord from '../models/CAPARecord.js';
import SafetyReport from '../models/SafetyReport.js';

export const getAllCAPA = async (req, res) => {
  try {
    const { status, mineId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (mineId) query.mineId = mineId;

    const records = await CAPARecord.find(query)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email')
      .populate('reportedBy', 'name email');

    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCAPAById = async (req, res) => {
  try {
    const record = await CAPARecord.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('reportedBy', 'name email')
      .populate('correctiveActions.assignedTo', 'name email')
      .populate('preventiveActions.assignedTo', 'name email');

    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCAPA = async (req, res) => {
  try {
    const { title, description, rootCause, severity, mineId, incidentId, owner, correctiveActions, preventiveActions } =
      req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const record = new CAPARecord({
      title,
      description,
      rootCause,
      severity,
      mineId,
      incidentId,
      owner,
      reportedBy: req.user?._id,
      correctiveActions: correctiveActions || [],
      preventiveActions: preventiveActions || [],
    });

    await record.save();
    res.status(201).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCAPA = async (req, res) => {
  try {
    const record = await CAPARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });

    const fields = ['title', 'description', 'rootCause', 'severity', 'status', 'owner', 'correctiveActions', 'preventiveActions', 'closureNotes'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) record[f] = req.body[f];
    });

    if (req.body.status === 'closed') {
      record.closedAt = new Date();
      record.closedBy = req.user?._id;
    }

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCAPAAction = async (req, res) => {
  try {
    const { actionType, actionId, verificationNotes } = req.body;
    const record = await CAPARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });

    const list = actionType === 'preventive' ? record.preventiveActions : record.correctiveActions;
    const action = list.id(actionId);
    if (!action) return res.status(404).json({ success: false, message: 'Action not found' });

    action.status = 'verified';
    action.verifiedBy = req.user?._id;
    action.verifiedAt = new Date();
    action.verificationNotes = verificationNotes;

    const allVerified = [...record.correctiveActions, ...record.preventiveActions].every(
      (a) => a.status === 'verified' || a.status === 'completed'
    );
    if (allVerified) record.status = 'verification';

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCAPA = async (req, res) => {
  try {
    const record = await CAPARecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });
    res.json({ success: true, message: 'CAPA deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeCAPAAction = async (req, res) => {
  try {
    const { actionType, actionId, notes } = req.body;
    const record = await CAPARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });

    const list = actionType === 'preventive' ? record.preventiveActions : record.correctiveActions;
    const action = list.id(actionId);
    if (!action) return res.status(404).json({ success: false, message: 'Action not found' });

    action.status = 'completed';
    action.completedAt = new Date();
    if (notes) action.description = `${action.description || ''}\n${notes}`.trim();

    if (record.status === 'open') record.status = 'in_progress';

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCAPAClosure = async (req, res) => {
  try {
    const { closureNotes } = req.body;
    const record = await CAPARecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'CAPA not found' });

    const allActions = [...record.correctiveActions, ...record.preventiveActions];
    if (allActions.length && !allActions.every((a) => a.status === 'verified')) {
      return res.status(400).json({
        success: false,
        message: 'All corrective and preventive actions must be verified before closure',
      });
    }

    record.status = 'closed';
    record.closedAt = new Date();
    record.closedBy = req.user?._id;
    record.closureNotes = closureNotes || record.closureNotes;

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSafetyReportsForCAPA = async (_req, res) => {
  try {
    const reports = await SafetyReport.find({ status: { $ne: 'Resolved' } })
      .select('reportTitle description riskLevel incidentDate location status')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getAllCAPA,
  getCAPAById,
  createCAPA,
  updateCAPA,
  verifyCAPAAction,
  completeCAPAAction,
  approveCAPAClosure,
  getSafetyReportsForCAPA,
  deleteCAPA,
};
