import RealTimeMonitoring from '../models/RealTimeMonitoring.js';
import Resource from '../models/Resource.js';
import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';

const EQUIPMENT_STATUSES = ['operational', 'warning', 'malfunction', 'offline', 'maintenance'];

export const deriveEquipmentStatus = (resource, maintenanceTasks) => {
  const related = maintenanceTasks.filter(
    (m) =>
      m.equipmentId === String(resource._id) ||
      m.equipmentName === resource.name ||
      (m.equipmentId && m.equipmentId === resource.name)
  );
  const overdue = related.some(
    (m) => !['completed', 'cancelled'].includes(m.status) && new Date(m.dueDate) < new Date()
  );
  const openEmergency = related.some((m) => m.category === 'emergency' && m.status !== 'completed');
  if (openEmergency || overdue) return 'warning';
  if (resource.status === 'critical' || resource.status === 'low') return 'warning';
  if (resource.used >= resource.threshold?.critical) return 'malfunction';
  return 'operational';
};

export const buildEquipmentFromResources = (resources, maintenanceTasks) =>
  resources
    .filter((r) => r.type === 'equipment')
    .map((r) => ({
      equipmentId: String(r._id),
      name: r.name,
      type: r.type,
      status: deriveEquipmentStatus(r, maintenanceTasks),
      location: r.location || '',
      metrics: {
        utilization: r.available > 0 ? Math.round((r.used / (r.used + r.available)) * 100) : 0,
        available: r.available,
        used: r.used,
      },
      alerts: r.status === 'critical' ? ['Resource threshold critical'] : [],
      lastMaintenance: maintenanceTasks
        .filter((m) => m.equipmentName === r.name || m.equipmentId === String(r._id))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date,
    }));

export async function getOrCreateMonitoringDoc(mineId) {
  let monitoring = await RealTimeMonitoring.findOne({ mineId }).sort({ timestamp: -1 });
  if (monitoring) return monitoring;

  const [resources, maintenanceTasks] = await Promise.all([
    Resource.find({ mineId }),
    Maintenance.find({ mineId }),
  ]);

  monitoring = new RealTimeMonitoring({
    mineId,
    activePersonnel: [],
    equipmentStatus: buildEquipmentFromResources(resources, maintenanceTasks),
    environmentalConditions: {},
    operationalMetrics: {
      productionRate: 0,
      activeEquipment: resources.filter((r) => r.type === 'equipment').length,
      personnelCount: 0,
    },
  });
  await monitoring.save();
  return monitoring;
}

export async function syncEquipmentFromDb(mineId, monitoring) {
  const [resources, maintenanceTasks] = await Promise.all([
    Resource.find({ mineId }),
    Maintenance.find({ mineId }),
  ]);
  const built = buildEquipmentFromResources(resources, maintenanceTasks);
  const byId = Object.fromEntries((monitoring.equipmentStatus || []).map((e) => [e.equipmentId, e]));

  monitoring.equipmentStatus = built.map((eq) => {
    const existing = byId[eq.equipmentId];
    if (!existing) return eq;
    return {
      ...eq,
      status: existing.status && EQUIPMENT_STATUSES.includes(existing.status) ? existing.status : eq.status,
      metrics: { ...eq.metrics, ...(existing.metrics || {}) },
    };
  });
  monitoring.operationalMetrics = {
    ...(monitoring.operationalMetrics || {}),
    activeEquipment: built.length,
  };
  monitoring.timestamp = new Date();
  await monitoring.save();
  return monitoring;
}

export async function upsertPersonnelLocation(mineId, userId, location, vitalSigns) {
  let monitoring = await getOrCreateMonitoringDoc(mineId);
  const user = await User.findById(userId).select('name role');
  const idx = monitoring.activePersonnel.findIndex((p) => String(p.userId) === String(userId));

  const entry = {
    userId,
    name: user?.name || 'Worker',
    role: user?.role || 'worker',
    location,
    status: 'active',
    lastUpdate: new Date(),
    vitalSigns: vitalSigns || undefined,
  };

  if (idx >= 0) {
    monitoring.activePersonnel[idx] = { ...monitoring.activePersonnel[idx].toObject?.() || monitoring.activePersonnel[idx], ...entry };
  } else {
    monitoring.activePersonnel.push(entry);
  }

  monitoring.operationalMetrics = {
    ...(monitoring.operationalMetrics || {}),
    personnelCount: monitoring.activePersonnel.filter((p) => p.status === 'active').length,
  };
  monitoring.timestamp = new Date();
  await monitoring.save();
  return monitoring;
}

export async function updateEquipmentStatus(mineId, equipmentId, status, metrics = {}) {
  let monitoring = await getOrCreateMonitoringDoc(mineId);
  await syncEquipmentFromDb(mineId, monitoring);
  monitoring = await RealTimeMonitoring.findOne({ mineId }).sort({ timestamp: -1 });

  const idx = monitoring.equipmentStatus.findIndex((e) => e.equipmentId === equipmentId);
  if (idx < 0) {
    return { ok: false, message: 'Equipment not found for this mine' };
  }

  monitoring.equipmentStatus[idx].status = status;
  monitoring.equipmentStatus[idx].metrics = {
    ...(monitoring.equipmentStatus[idx].metrics || {}),
    ...metrics,
  };
  monitoring.timestamp = new Date();
  await monitoring.save();
  return { ok: true, monitoring, equipment: monitoring.equipmentStatus[idx] };
}

export async function updateEnvironmentalConditions(mineId, conditions) {
  const monitoring = await getOrCreateMonitoringDoc(mineId);
  monitoring.environmentalConditions = {
    ...(monitoring.environmentalConditions || {}),
    ...conditions,
    gasLevels: {
      ...(monitoring.environmentalConditions?.gasLevels || {}),
      ...(conditions.gasLevels || {}),
    },
    ventilation: {
      ...(monitoring.environmentalConditions?.ventilation || {}),
      ...(conditions.ventilation || {}),
    },
    temperature: {
      ...(monitoring.environmentalConditions?.temperature || {}),
      ...(conditions.temperature || {}),
    },
  };
  monitoring.timestamp = new Date();
  await monitoring.save();
  return monitoring;
}

export default {
  getOrCreateMonitoringDoc,
  syncEquipmentFromDb,
  upsertPersonnelLocation,
  updateEquipmentStatus,
  updateEnvironmentalConditions,
  buildEquipmentFromResources,
};
