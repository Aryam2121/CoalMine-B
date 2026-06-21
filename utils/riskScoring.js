/**
 * Deterministic risk scoring from operational data (no randomness).
 */

const MS_DAY = 24 * 60 * 60 * 1000;

export const computeEquipmentAgeYears = (maintenanceTasks, equipmentId) => {
  const related = maintenanceTasks.filter(
    (m) => m.equipmentId === equipmentId || m.equipmentName === equipmentId
  );
  if (!related.length) return 0;
  const oldest = related.reduce(
    (min, m) => Math.min(min, new Date(m.date || m.createdAt).getTime()),
    Date.now()
  );
  return Math.max(0, (Date.now() - oldest) / (365 * MS_DAY));
};

export const countFailureFrequency = (alerts, equipmentKeywords = []) => {
  if (!equipmentKeywords.length) return 0;
  return alerts.filter((a) => {
    const msg = (a.message || '').toLowerCase();
    return equipmentKeywords.some((k) => msg.includes(k.toLowerCase()));
  }).length;
};

export const computeMaintenanceRiskFactors = (maintenanceTasks, mineId) => {
  const scoped = mineId
    ? maintenanceTasks.filter((m) => String(m.mineId) === String(mineId))
    : maintenanceTasks;

  const now = Date.now();
  const overdue = scoped.filter(
    (m) => !['completed', 'cancelled'].includes(m.status) && new Date(m.dueDate).getTime() < now
  );
  const open = scoped.filter((m) => !['completed', 'cancelled'].includes(m.status));
  const emergency = scoped.filter((m) => m.category === 'emergency' && m.status !== 'completed');

  const equipmentIds = [...new Set(scoped.map((m) => m.equipmentId).filter(Boolean))];
  let totalAge = 0;
  equipmentIds.forEach((id) => {
    totalAge += computeEquipmentAgeYears(scoped, id);
  });
  const avgEquipmentAge = equipmentIds.length ? totalAge / equipmentIds.length : 0;

  return {
    overdueCount: overdue.length,
    openCount: open.length,
    emergencyCount: emergency.length,
    avgEquipmentAgeYears: Math.round(avgEquipmentAge * 10) / 10,
    equipmentCount: equipmentIds.length,
  };
};

export const computeRiskScore = ({
  criticalAlerts = 0,
  unresolvedAlerts = 0,
  overdueMaintenance = 0,
  openMaintenance = 0,
  avgEquipmentAgeYears = 0,
  failureFrequency = 0,
  emergencyMaintenance = 0,
}) => {
  const score = Math.min(
    100,
    Math.round(
      criticalAlerts * 12 +
        unresolvedAlerts * 8 +
        overdueMaintenance * 10 +
        openMaintenance * 2 +
        avgEquipmentAgeYears * 3 +
        failureFrequency * 6 +
        emergencyMaintenance * 15
    )
  );
  return Math.max(0, score);
};

export const riskLevelFromScore = (score) => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

export const computeConfidence = ({ dataPoints = 0, overdueMaintenance = 0, unresolvedAlerts = 0 }) => {
  const base = Math.min(95, 40 + dataPoints * 2);
  const penalty = overdueMaintenance * 3 + unresolvedAlerts * 2;
  return Math.max(50, Math.min(95, Math.round(base - penalty)));
};

export const computeEquipmentRiskList = (maintenanceTasks, alerts = [], mineId) => {
  const scoped = mineId
    ? maintenanceTasks.filter((m) => String(m.mineId) === String(mineId))
    : maintenanceTasks;

  const byEquipment = new Map();
  scoped.forEach((m) => {
    if (['completed', 'cancelled'].includes(m.status)) return;
    const key = m.equipmentId || m.equipmentName || m.task;
    if (!byEquipment.has(key)) byEquipment.set(key, []);
    byEquipment.get(key).push(m);
  });

  const now = Date.now();
  return [...byEquipment.entries()]
    .map(([name, tasks]) => {
      const overdue = tasks.filter(
        (m) => new Date(m.dueDate).getTime() < now
      ).length;
      const open = tasks.length;
      const age = computeEquipmentAgeYears(scoped, name);
      const emergency = tasks.filter(
        (m) => m.category === 'emergency' && m.status !== 'completed'
      ).length;
      const keyword = String(name).split(/\s+/)[0];
      const failures = countFailureFrequency(alerts, keyword ? [keyword] : []);
      const score = computeRiskScore({
        overdueMaintenance: overdue,
        openMaintenance: open,
        avgEquipmentAgeYears: age,
        failureFrequency: failures,
        emergencyMaintenance: emergency,
      });
      return {
        name,
        equipmentId: tasks[0]?.equipmentId,
        score,
        status: overdue > 0 ? 'overdue' : tasks[0]?.status || 'pending',
      };
    })
    .sort((a, b) => b.score - a.score);
};

export const daysSinceLastIncident = (alerts) => {
  if (!alerts.length) return null;
  const latest = alerts.reduce(
    (max, a) => Math.max(max, new Date(a.timestamp || a.createdAt).getTime()),
    0
  );
  return Math.floor((Date.now() - latest) / MS_DAY);
};

export default {
  computeRiskScore,
  riskLevelFromScore,
  computeConfidence,
  computeMaintenanceRiskFactors,
  computeEquipmentAgeYears,
  countFailureFrequency,
  computeEquipmentRiskList,
  daysSinceLastIncident,
};
