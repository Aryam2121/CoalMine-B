import CoalMine from '../models/coalMineModel.js';
import Mine from '../models/Mine.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';
import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import EmergencyResponse from '../models/EmergencyResponse.js';
import Resource from '../models/Resource.js';

const safetyScore = (alerts, emergencies, maintenance) => {
  const critical = alerts.filter((a) => a.type === 'critical' && !a.resolved).length;
  const openEmergencies = emergencies.filter((e) => !['resolved', 'false_alarm'].includes(e.status)).length;
  const overdueMaint = maintenance.filter((m) => m.status === 'overdue').length;
  return Math.max(0, Math.min(100, 100 - critical * 8 - openEmergencies * 15 - overdueMaint * 5));
};

/** Per-mine productivity from resource utilization (coal + equipment). Returns null if no data. */
const productivityScoreForMine = (resources) => {
  const siteResources = resources.filter((r) => ['coal', 'equipment', 'fuel'].includes(r.type));
  if (!siteResources.length) return null;

  const utilizations = siteResources.map((r) => {
    const total = r.used + r.available;
    if (total <= 0) return 0;
    return (r.used / total) * 100;
  });

  return Math.min(100, Math.round(utilizations.reduce((a, b) => a + b, 0) / utilizations.length));
};

export const getExecutiveSummary = async (req, res) => {
  try {
    const [coalMines, mines, users, alerts, maintenance, emergencies, resources, predictions] =
      await Promise.all([
        CoalMine.find({ deleted: { $ne: true } }).select('name location workers'),
        Mine.find().select('name lat lng status'),
        User.countDocuments(),
        Alert.find().sort({ timestamp: -1 }).limit(500),
        Maintenance.find(),
        EmergencyResponse.find().sort({ createdAt: -1 }).limit(50),
        Resource.find(),
        PredictiveAnalytics.find().sort({ analysisDate: -1 }).limit(20),
      ]);

    const allMines = [
      ...coalMines.map((m) => ({ id: m._id, name: m.name, type: 'coal', location: m.location, workers: m.workers?.length || 0 })),
      ...mines.map((m) => ({ id: m._id, name: m.name, type: 'mine', location: { latitude: m.lat, longitude: m.lng }, workers: 0 })),
    ];

    const siteMetrics = allMines.map((site) => {
      const siteAlerts = alerts.filter((a) => String(a.createdBy) === String(site.id));
      const siteMaint = maintenance.filter((m) => String(m.mineId) === String(site.id));
      const siteEmergencies = emergencies.filter((e) => String(e.mineId) === String(site.id));
      const siteResources = resources.filter((r) => String(r.mineId) === String(site.id));
      const prediction = predictions.find((p) => String(p.mineId) === String(site.id));
      const productivityScore = productivityScoreForMine(siteResources);

      return {
        ...site,
        openAlerts: siteAlerts.filter((a) => !a.resolved).length,
        criticalAlerts: siteAlerts.filter((a) => a.type === 'critical' && !a.resolved).length,
        maintenanceOpen: siteMaint.filter((m) => !['completed', 'cancelled'].includes(m.status)).length,
        activeEmergencies: siteEmergencies.filter((e) => e.status === 'active' || e.status === 'responding').length,
        safetyScore: safetyScore(siteAlerts, siteEmergencies, siteMaint),
        productivityScore,
        riskScore: prediction?.riskScore ?? null,
        riskLevel: prediction?.riskLevel ?? 'unknown',
      };
    });

    const sitesWithProductivity = siteMetrics.filter((s) => s.productivityScore != null);

    const kpis = {
      totalSites: allMines.length,
      totalWorkers: users,
      openAlerts: alerts.filter((a) => !a.resolved).length,
      criticalAlerts: alerts.filter((a) => a.type === 'critical' && !a.resolved).length,
      activeEmergencies: emergencies.filter((e) => ['active', 'responding'].includes(e.status)).length,
      overdueMaintenance: maintenance.filter((m) => m.status === 'overdue').length,
      avgSafetyScore: siteMetrics.length
        ? Math.round(siteMetrics.reduce((s, m) => s + m.safetyScore, 0) / siteMetrics.length)
        : 0,
      avgProductivityScore: sitesWithProductivity.length
        ? Math.round(
            sitesWithProductivity.reduce((s, m) => s + m.productivityScore, 0) / sitesWithProductivity.length
          )
        : null,
    };

    res.json({ success: true, kpis, sites: siteMetrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getExecutiveSummary };
