import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import EmergencyResponse from '../models/EmergencyResponse.js';
import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import { getChatResponse } from '../models/chatbotModel.js';

const buildLiveContext = async (mineId) => {
  const alertQuery = mineId ? { createdBy: mineId } : {};
  const maintQuery = mineId ? { mineId } : {};

  const [alerts, maintenance, emergencies, prediction] = await Promise.all([
    Alert.find(alertQuery).sort({ timestamp: -1 }).limit(15),
    Maintenance.find(maintQuery).sort({ dueDate: 1 }).limit(15),
    EmergencyResponse.find(mineId ? { mineId } : {})
      .sort({ createdAt: -1 })
      .limit(5),
    mineId ? PredictiveAnalytics.findOne({ mineId }).sort({ analysisDate: -1 }) : null,
  ]);

  return {
    openAlerts: alerts.filter((a) => !a.resolved).length,
    criticalAlerts: alerts.filter((a) => a.type === 'critical' && !a.resolved).length,
    recentAlerts: alerts.slice(0, 5).map((a) => ({ type: a.type, message: a.message, resolved: a.resolved })),
    overdueMaintenance: maintenance.filter((m) => m.status === 'overdue').length,
    maintenancePending: maintenance.filter((m) => !['completed', 'cancelled'].includes(m.status)).length,
    maintenanceTasks: maintenance.slice(0, 5).map((m) => ({ task: m.task, status: m.status, priority: m.priority })),
    activeEmergencies: emergencies.filter((e) => ['active', 'responding'].includes(e.status)).length,
    riskScore: prediction?.riskScore ?? null,
    riskLevel: prediction?.riskLevel ?? null,
    topRecommendations: prediction?.recommendations?.slice(0, 3) || [],
  };
};

export const handleOperationsChat = async (req, res) => {
  const { message, language, mineId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const context = await buildLiveContext(mineId);
    const contextBlock = JSON.stringify(context, null, 2);
    const enrichedMessage = `[LIVE SYSTEM DATA]\n${contextBlock}\n\n[USER QUESTION]\n${message}\n\nAnswer using the live data above when relevant. Summarize risks, alerts, and maintenance clearly.`;

    const result = await getChatResponse(enrichedMessage, language);

    res.status(200).json({
      reply: result.reply,
      offline: result.offline ?? false,
      hint: result.hint,
      context,
      model: result.model,
    });
  } catch (error) {
    console.error('Operations chat error:', error);
    res.status(500).json({ error: 'Error processing operations request' });
  }
};

export default { handleOperationsChat };
