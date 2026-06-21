import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import CoalMine from '../models/coalMineModel.js';
import {
  getOrCreateMonitoringDoc,
  syncEquipmentFromDb,
  updateEquipmentStatus,
  updateEnvironmentalConditions,
} from '../services/monitoringService.js';
import { emitToMine } from '../utils/socketHandler.js';
import { isManagerRole } from '../config/roles.js';

export const getMonitoring = async (req, res) => {
  try {
    const { mineId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(mineId)) {
      return res.status(400).json({ success: false, message: 'Invalid mine ID' });
    }

    let monitoring = await getOrCreateMonitoringDoc(mineId);
    monitoring = await syncEquipmentFromDb(mineId, monitoring);

    res.json({ success: true, monitoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const patchEquipmentStatus = async (req, res) => {
  try {
    const { mineId, equipmentId } = req.params;
    const { status, metrics } = req.body;

    if (!isManagerRole(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Manager access required' });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const result = await updateEquipmentStatus(mineId, equipmentId, status, metrics || {});
    if (!result.ok) {
      return res.status(404).json({ success: false, message: result.message });
    }

    emitToMine(String(mineId), 'equipment:updated', {
      equipmentId,
      status,
      metrics: result.equipment.metrics,
      timestamp: new Date(),
    });

    res.json({ success: true, equipment: result.equipment, monitoring: result.monitoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const patchEnvironment = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { conditions } = req.body;

    if (!isManagerRole(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Manager access required' });
    }
    if (!conditions || typeof conditions !== 'object') {
      return res.status(400).json({ success: false, message: 'conditions object is required' });
    }

    const monitoring = await updateEnvironmentalConditions(mineId, conditions);

    emitToMine(String(mineId), 'environment:updated', {
      conditions: monitoring.environmentalConditions,
      timestamp: new Date(),
    });

    const gas = monitoring.environmentalConditions?.gasLevels || {};
    if (gas.methane > 1.5 || gas.carbonMonoxide > 50) {
      emitToMine(String(mineId), 'environment:danger', {
        gasLevels: gas,
        message: 'Dangerous gas levels detected',
      });
    }

    res.json({ success: true, monitoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlertHeatmap = async (req, res) => {
  try {
    const { mineId } = req.query;
    const alertQuery = mineId ? { createdBy: mineId } : {};
    const [alerts, mines] = await Promise.all([
      Alert.find(alertQuery).sort({ timestamp: -1 }).limit(200),
      CoalMine.find({ deleted: { $ne: true } }).select('name location'),
    ]);

    const mineMap = Object.fromEntries(mines.map((m) => [String(m._id), m]));
    const points = [];

    alerts.forEach((alert) => {
      const mine = mineMap[String(alert.createdBy)];
      if (mine?.location?.latitude != null) {
        points.push({
          lat: mine.location.latitude,
          lng: mine.location.longitude,
          intensity: alert.type === 'critical' ? 1 : 0.5,
          message: alert.message,
          type: alert.type,
          timestamp: alert.timestamp,
        });
      }
    });

    res.json({ success: true, points, mines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processRemindersNow = async (req, res) => {
  try {
    const { processComplianceReminders } = await import('../jobs/complianceReminderJob.js');
    const result = await processComplianceReminders();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getMonitoring,
  patchEquipmentStatus,
  patchEnvironment,
  getAlertHeatmap,
  processRemindersNow,
};
