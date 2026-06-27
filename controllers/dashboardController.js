import Mine from '../models/Mine.js';
import CoalMine from '../models/coalMineModel.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import Productivity from '../models/Productivity.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import ShiftLog from '../models/ShiftLog.js';
import NearMissReport from '../models/NearMissReport.js';
import ContractorVisitor from '../models/ContractorVisitor.js';
import WorkPermit from '../models/WorkPermit.js';
import EmergencyResponse from '../models/EmergencyResponse.js';
import SafetyDrill from '../models/SafetyDrill.js';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeeklyProductivity(records) {
  const last7 = records
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

  return {
    labels: last7.map((r) => {
      const d = new Date(r.date);
      return DAY_LABELS[d.getDay()];
    }),
    data: last7.map((r) => {
      const vals = Array.isArray(r.value) ? r.value : [r.value];
      const avg = vals.reduce((s, n) => s + Number(n), 0) / vals.length;
      return Math.round(avg);
    }),
  };
}

function buildSafetyCompliance(alerts) {
  const unresolved = alerts.filter((a) => !a.resolved);
  const warning = unresolved.filter((a) => a.type === 'warning').length;
  const critical = unresolved.filter((a) => a.type === 'critical').length;
  const resolved = alerts.filter((a) => a.resolved).length;
  return {
    labels: ['Resolved', 'Warning', 'Critical'],
    data: [resolved, warning, critical],
  };
}

function buildDepartmentPerformance(resources) {
  const byType = {};
  resources.forEach((r) => {
    const key = r.type || 'other';
    if (!byType[key]) byType[key] = { used: 0, count: 0 };
    byType[key].used += r.used || 0;
    byType[key].count += 1;
  });
  const entries = Object.entries(byType).slice(0, 4);
  return {
    labels: entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    data: entries.map(([, v]) => Math.round(v.used / v.count)),
  };
}

export const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let maintenanceQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      maintenanceQuery = { date: { $gte: start, $lte: end } };
    }

    const [
      mineCount,
      coalMineCount,
      userCount,
      alerts,
      maintenance,
      productivity,
      resources,
      recentShifts,
      nearMissOpen,
      contractorsOnSite,
      activePermits,
      activeEvacuations,
      upcomingDrills,
    ] = await Promise.all([
      Mine.countDocuments(),
      CoalMine.countDocuments({ deleted: { $ne: true } }),
      User.countDocuments(),
      Alert.find().sort('-timestamp').limit(50).populate('createdBy', 'name').lean(),
      Maintenance.find(maintenanceQuery).sort('-date').limit(30).lean(),
      Productivity.find().sort('-date').limit(30).lean(),
      Resource.find().lean(),
      ShiftLog.find().sort('-createdAt').limit(5).lean(),
      NearMissReport.countDocuments({ status: { $in: ['submitted', 'reviewing'] } }),
      ContractorVisitor.countDocuments({ status: 'checked_in' }),
      WorkPermit.countDocuments({ status: { $in: ['approved', 'active'] } }),
      EmergencyResponse.countDocuments({
        status: { $in: ['active', 'responding'] },
        'evacuationStatus.initiated': true,
        'evacuationStatus.completedAt': { $exists: false },
      }),
      SafetyDrill.countDocuments({
        status: 'scheduled',
        scheduledDate: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const openAlerts = alerts.filter((a) => !a.resolved);
    const weekly = buildWeeklyProductivity(productivity);
    const safety = buildSafetyCompliance(alerts);
    const departments = buildDepartmentPerformance(resources);

    const maintenanceByStatus = maintenance.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      stats: {
        activeMines: mineCount,
        coalMineSites: coalMineCount,
        totalWorkers: userCount,
        openAlerts: openAlerts.length,
        criticalAlerts: openAlerts.filter((a) => a.type === 'critical').length,
        maintenanceOpen: maintenance.filter((m) => !['completed', 'cancelled'].includes(m.status)).length,
        avgProductivity: weekly.data.length
          ? Math.round(weekly.data.reduce((a, b) => a + b, 0) / weekly.data.length)
          : 0,
        nearMissOpen,
        contractorsOnSite,
        activeWorkPermits: activePermits,
        activeEvacuations,
        upcomingDrills,
      },
      charts: {
        productivity: {
          labels: weekly.labels,
          datasets: [{
            label: 'Productivity index',
            data: weekly.data,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.25)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#1e293b',
          }],
        },
        safetyCompliance: {
          labels: safety.labels,
          datasets: [{
            label: 'Alerts',
            data: safety.data,
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderColor: '#1e293b',
            borderWidth: 2,
          }],
        },
        departmentPerformance: {
          labels: departments.labels,
          datasets: [{
            label: 'Resource utilization %',
            data: departments.data,
            backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#64748b'],
            borderRadius: 6,
          }],
        },
      },
      recentAlerts: openAlerts.slice(0, 8).map((a) => ({
        _id: a._id,
        message: a.message,
        type: a.type,
        timestamp: a.timestamp,
        createdBy: a.createdBy?.name,
      })),
      maintenance,
      recentShifts,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
};

export default { getDashboardSummary };
