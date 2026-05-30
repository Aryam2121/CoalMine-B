import Alert from '../models/Alert.js';
import mongoose from 'mongoose';
import { emitToAll } from '../utils/socketHandler.js';

const getAllAlerts = async (req, res) => {
  try {
    const { type, resolved, page = 1, limit = 10, sort = '-timestamp' } = req.query;

    const query = {};
    if (type) query.type = type;
    if (resolved !== undefined && resolved !== null && resolved !== '') {
      query.resolved = resolved === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const alerts = await Alert.find(query)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email');

    const totalAlerts = await Alert.countDocuments(query);

    res.json({
      alerts,
      total: totalAlerts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalAlerts / limitNum) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

const createAlert = async (req, res) => {
  try {
    const { message, type, createdBy } = req.body;

    if (!message || !type) {
      return res.status(400).json({ message: 'Message and type are required' });
    }

    if (!['warning', 'critical'].includes(type)) {
      return res.status(400).json({ message: 'Invalid alert type' });
    }

    const alert = new Alert({
      message,
      type,
      ...(createdBy && mongoose.Types.ObjectId.isValid(createdBy) ? { createdBy } : {}),
    });
    await alert.save();

    const saved = await Alert.findById(alert._id)
      .populate('createdBy', 'name email')
      .lean();

    emitToAll('alert:new', saved || alert.toObject());

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.body.resolvedBy || req.body.userId;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.resolved) {
      return res.status(200).json({ message: 'Alert already resolved', alert });
    }

    if (resolvedBy && mongoose.Types.ObjectId.isValid(resolvedBy)) {
      await alert.resolve(resolvedBy);
    } else {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      await alert.save({ validateBeforeSave: false });
    }

    res.status(200).json({ message: 'Alert resolved', alert });

    emitToAll('alert:resolved', {
      alertId: alert._id,
      alert: alert.toObject ? alert.toObject() : alert,
    });
  } catch (error) {
    console.error('Error resolving alert:', error.message);
    res.status(500).json({ message: 'Error resolving alert', error: error.message });
  }
};

const resolveAllAlerts = async (req, res) => {
  try {
    const resolvedBy = req.body.resolvedBy || req.body.userId;
    const update = {
      resolved: true,
      resolvedAt: new Date(),
    };
    if (resolvedBy && mongoose.Types.ObjectId.isValid(resolvedBy)) {
      update.resolvedBy = resolvedBy;
    }

    const result = await Alert.updateMany({ resolved: false }, { $set: update });

    res.status(200).json({
      message: 'All unresolved alerts marked as resolved',
      modifiedCount: result.modifiedCount,
    });

    emitToAll('alert:bulk-resolved', { modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving alerts', error: error.message });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted successfully', alert });

    emitToAll('alert:deleted', { alertId: id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert', error: error.message });
  }
};

export default { getAllAlerts, createAlert, resolveAlert, resolveAllAlerts, deleteAlert };
