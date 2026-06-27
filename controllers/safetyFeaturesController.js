import WorkPermit from '../models/WorkPermit.js';
import Equipment from '../models/Equipment.js';
import HazardZone from '../models/HazardZone.js';
import NearMissReport from '../models/NearMissReport.js';
import SafetyDrill from '../models/SafetyDrill.js';
import ContractorVisitor from '../models/ContractorVisitor.js';
import User from '../models/User.js';
import CAPARecord from '../models/CAPARecord.js';
import Maintenance from '../models/Maintenance.js';
import { emitToMine } from '../utils/socketHandler.js';
import { sendPushToMine } from '../services/pushNotificationService.js';

const crud = (Model, label) => ({
  list: async (req, res) => {
    try {
      const { mineId, status } = req.query;
      const query = {};
      if (mineId) query.mineId = mineId;
      if (status) query.status = status;
      const items = await Model.find(query).sort({ createdAt: -1 }).limit(200);
      res.json({ success: true, items });
    } catch (err) {
      res.status(500).json({ success: false, message: `Error fetching ${label}`, error: err.message });
    }
  },
  get: async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: `${label} not found` });
      res.json({ success: true, item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create({ ...req.body, requestedBy: req.body.requestedBy || req.user._id, createdBy: req.user._id, registeredBy: req.user._id, reportedBy: req.body.anonymous ? undefined : req.user._id });
      if (item.mineId) emitToMine(String(item.mineId), `${label}:created`, item);
      res.status(201).json({ success: true, item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: `${label} not found` });
      if (item.mineId) emitToMine(String(item.mineId), `${label}:updated`, item);
      res.json({ success: true, item });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  remove: async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: `${label} not found` });
      res.json({ success: true, message: `${label} deleted` });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
});

const workPermits = crud(WorkPermit, 'workPermit');
const equipment = crud(Equipment, 'equipment');
const hazardZones = crud(HazardZone, 'hazardZone');
const nearMiss = crud(NearMissReport, 'nearMiss');
const drills = crud(SafetyDrill, 'safetyDrill');
const contractors = crud(ContractorVisitor, 'contractor');

export const listWorkPermits = workPermits.list;
export const getWorkPermit = workPermits.get;
export const createWorkPermit = workPermits.create;
export const updateWorkPermit = workPermits.update;
export const deleteWorkPermit = workPermits.remove;

export const approveWorkPermit = async (req, res) => {
  try {
    const permit = await WorkPermit.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    if (!permit) return res.status(404).json({ success: false, message: 'Permit not found' });
    emitToMine(String(permit.mineId), 'workPermit:approved', permit);
    res.json({ success: true, item: permit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listEquipment = equipment.list;
export const getEquipment = equipment.get;
export const createEquipment = equipment.create;
export const updateEquipment = equipment.update;
export const deleteEquipment = equipment.remove;

export const listHazardZones = hazardZones.list;
export const getHazardZone = hazardZones.get;
export const createHazardZone = hazardZones.create;
export const updateHazardZone = hazardZones.update;
export const deleteHazardZone = hazardZones.remove;

export const listNearMiss = nearMiss.list;
export const getNearMiss = nearMiss.get;
export const createNearMiss = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.anonymous) data.reportedBy = req.user._id;
    const item = await NearMissReport.create(data);
    emitToMine(String(item.mineId), 'nearMiss:created', item);
    if (item.severity === 'high') {
      sendPushToMine(item.mineId, {
        title: '⚠️ High-severity near-miss reported',
        body: item.title,
        data: { type: 'near_miss', id: String(item._id) },
      }).catch(() => {});
    }
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateNearMiss = nearMiss.update;
export const deleteNearMiss = nearMiss.remove;

export const escalateNearMissToCapa = async (req, res) => {
  try {
    const report = await NearMissReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const capa = await CAPARecord.create({
      title: `CAPA: ${report.title}`,
      description: report.description,
      severity: report.severity === 'high' ? 'High' : 'Medium',
      owner: req.user._id,
      reportedBy: req.user._id,
      status: 'open',
      mineId: report.mineId,
    });

    report.status = 'actioned';
    report.capaId = capa._id;
    report.reviewedBy = req.user._id;
    await report.save();

    res.json({ success: true, report, capa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listDrills = drills.list;
export const getDrill = drills.get;
export const createDrill = drills.create;
export const updateDrill = drills.update;
export const deleteDrill = drills.remove;

export const completeDrill = async (req, res) => {
  try {
    const drill = await SafetyDrill.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedDate: new Date(),
        results: req.body.results,
      },
      { new: true }
    );
    if (!drill) return res.status(404).json({ success: false, message: 'Drill not found' });
    res.json({ success: true, item: drill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listContractors = contractors.list;
export const getContractor = contractors.get;
export const createContractor = contractors.create;
export const updateContractor = contractors.update;
export const deleteContractor = contractors.remove;

export const checkOutContractor = async (req, res) => {
  try {
    const record = await ContractorVisitor.findByIdAndUpdate(
      req.params.id,
      { status: 'checked_out', checkOutAt: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, item: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const registerFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { fcmTokens: token } });
    res.json({ success: true, message: 'FCM token registered' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMaintenanceSchedule = async (req, res) => {
  try {
    const { mineId } = req.query;
    const query = mineId ? { mineId } : {};
    const tasks = await Maintenance.find({
      ...query,
      $or: [
        { 'recurringSchedule.isRecurring': true },
        { dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } },
      ],
    })
      .sort({ dueDate: 1 })
      .populate('assignedTo', 'name')
      .limit(100);

    res.json({ success: true, schedule: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  listWorkPermits, getWorkPermit, createWorkPermit, updateWorkPermit, deleteWorkPermit, approveWorkPermit,
  listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment,
  listHazardZones, getHazardZone, createHazardZone, updateHazardZone, deleteHazardZone,
  listNearMiss, getNearMiss, createNearMiss, updateNearMiss, deleteNearMiss, escalateNearMissToCapa,
  listDrills, getDrill, createDrill, updateDrill, deleteDrill, completeDrill,
  listContractors, getContractor, createContractor, updateContractor, deleteContractor, checkOutContractor,
  registerFcmToken, getMaintenanceSchedule,
};
