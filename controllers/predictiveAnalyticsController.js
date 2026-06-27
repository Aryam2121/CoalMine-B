import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import IncidentPrediction from '../models/IncidentPrediction.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import mongoose from 'mongoose';
import {
  computeRiskScore,
  riskLevelFromScore,
  computeConfidence,
  computeMaintenanceRiskFactors,
  daysSinceLastIncident,
  computeEquipmentRiskList,
} from '../utils/riskScoring.js';

// AI-Powered Predictive Analytics Controller

// Generate safety predictions using AI/ML algorithms
export const generateSafetyPrediction = async (req, res) => {
  try {
    const { mineId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(mineId)) {
      return res.status(400).json({ message: 'Invalid mine ID' });
    }

    // Fetch historical data for analysis
    const recentAlerts = await Alert.find({ 
      createdBy: mineId,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const maintenanceTasks = await Maintenance.find({
      mineId,
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    });

    const maintFactors = computeMaintenanceRiskFactors(maintenanceTasks, mineId);

    // Calculate risk factors
    const criticalAlerts = recentAlerts.filter(a => a.type === 'critical').length;
    const unresolvedAlerts = recentAlerts.filter(a => !a.resolved).length;
    const overdueMaintenanceTasks = maintFactors.overdueCount;

    const failureFrequency = recentAlerts.filter(
      (a) => a.type === 'critical' && (a.message || '').toLowerCase().includes('equipment')
    ).length;

    const riskScore = computeRiskScore({
      criticalAlerts,
      unresolvedAlerts,
      overdueMaintenance: overdueMaintenanceTasks,
      openMaintenance: maintFactors.openCount,
      avgEquipmentAgeYears: maintFactors.avgEquipmentAgeYears,
      failureFrequency,
      emergencyMaintenance: maintFactors.emergencyCount,
    });

    let riskLevel = riskLevelFromScore(riskScore);

    // Generate predictions
    const predictedIncidents = [];
    if (riskScore > 40) {
      if (overdueMaintenanceTasks > 3) {
        predictedIncidents.push({
          type: 'equipment_failure',
          probability: Math.min(95, riskScore + 10),
          estimatedTimeframe: riskScore > 70 ? 'immediate' : 'within_24h',
          affectedArea: 'Equipment Zone A',
          recommendedActions: [
            'Immediate equipment inspection required',
            'Schedule emergency maintenance',
            'Reduce operational load until inspection'
          ]
        });
      }
      
      if (criticalAlerts > 5) {
        predictedIncidents.push({
          type: 'gas_leak',
          probability: Math.min(85, riskScore),
          estimatedTimeframe: 'within_week',
          affectedArea: 'Ventilation System',
          recommendedActions: [
            'Enhanced gas monitoring',
            'Ventilation system check',
            'Staff safety briefing'
          ]
        });
      }
    }

    // Generate recommendations
    const recommendations = [];
    if (overdueMaintenanceTasks > 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Complete all overdue maintenance tasks immediately',
        estimatedCost: overdueMaintenanceTasks * 5000,
        estimatedTimeToImplement: `${overdueMaintenanceTasks * 2} days`,
        potentialRiskReduction: 30
      });
    }

    if (unresolvedAlerts > 3) {
      recommendations.push({
        priority: 'high',
        action: 'Address all unresolved safety alerts',
        estimatedCost: 10000,
        estimatedTimeToImplement: '3-5 days',
        potentialRiskReduction: 25
      });
    }

    recommendations.push({
      priority: riskLevel === 'critical' ? 'critical' : 'medium',
      action: 'Conduct comprehensive safety audit',
      estimatedCost: 15000,
      estimatedTimeToImplement: '1 week',
      potentialRiskReduction: 20
    });

    const daysWithout = daysSinceLastIncident(recentAlerts);

    const prediction = new PredictiveAnalytics({
      mineId,
      riskScore,
      riskLevel,
      predictedIncidents,
      factors: {
        weatherConditions: null,
        operationalFactors: {
          hoursOperated: maintFactors.openCount * 8,
          maintenanceOverdue: overdueMaintenanceTasks,
          staffFatigue: Math.min(100, unresolvedAlerts * 5),
          equipmentAge: maintFactors.avgEquipmentAgeYears,
        },
        historicalData: {
          pastIncidents: recentAlerts.length,
          daysWithoutIncident: daysWithout,
          averageResponseTime: null,
        },
      },
      recommendations,
      mlModelVersion: '2.0.0-deterministic',
      confidence: computeConfidence({
        dataPoints: recentAlerts.length + maintenanceTasks.length,
        overdueMaintenance: overdueMaintenanceTasks,
        unresolvedAlerts,
      }),
    });

    await prediction.save();

    // Generate alerts for critical predictions
    if (riskLevel === 'critical' || riskScore > 70) {
      prediction.alerts.push({
        alertType: 'High Risk Detected',
        severity: 'critical',
        message: `Critical risk level detected at mine. Immediate action required. Risk score: ${riskScore}`,
        timestamp: new Date()
      });
      await prediction.save();
      
      // Create system alert
      await Alert.create({
        message: `PREDICTIVE ALERT: High risk detected (Score: ${riskScore}). Review safety measures immediately.`,
        type: 'critical',
        createdBy: mineId
      });
    }

    res.status(201).json({
      success: true,
      prediction,
      message: `Risk assessment completed. Status: ${riskLevel.toUpperCase()}`
    });

  } catch (error) {
    console.error('Error generating safety prediction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating safety prediction', 
      error: error.message 
    });
  }
};

// Get all predictions for a mine
export const getPredictions = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const predictions = await PredictiveAnalytics.find({ mineId })
      .sort({ analysisDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('mineId');

    const total = await PredictiveAnalytics.countDocuments({ mineId });

    res.json({
      success: true,
      predictions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching predictions', 
      error: error.message 
    });
  }
};

// Get high-risk mines
export const getHighRiskMines = async (req, res) => {
  try {
    const highRiskMines = await PredictiveAnalytics.getHighRiskMines();
    
    res.json({
      success: true,
      count: highRiskMines.length,
      mines: highRiskMines
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching high-risk mines', 
      error: error.message 
    });
  }
};

// Generate incident prediction using ML patterns
export const generateIncidentPrediction = async (req, res) => {
  try {
    const { mineId } = req.params;

    // Analyze historical patterns
    const historicalAlerts = await Alert.find({ createdBy: mineId })
      .sort({ timestamp: -1 })
      .limit(100);

    // Pattern analysis
    const hourCounts = new Array(24).fill(0);
    const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    historicalAlerts.forEach(alert => {
      const hour = new Date(alert.timestamp).getHours();
      const day = new Date(alert.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      hourCounts[hour]++;
      if (dayCounts[day] !== undefined) dayCounts[day]++;
    });

    const highRiskHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(h => h.hour);

    const highRiskDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(d => d[0]);

    const incidentProbability = Math.min(
      95,
      Math.round(
        (historicalAlerts.filter((a) => a.type === 'critical').length /
          Math.max(historicalAlerts.length, 1)) *
          100
      )
    );

    const confidenceLevel = Math.min(
      95,
      Math.max(50, 55 + Math.min(historicalAlerts.length, 20) * 2)
    );

    const lastIncidentDays = daysSinceLastIncident(historicalAlerts);

    const prediction = new IncidentPrediction({
      mineId,
      predictionWindow: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      patterns: {
        timeOfDay: {
          highRiskHours,
          peakIncidentHour: highRiskHours[0] || 12
        },
        dayOfWeek: {
          highRiskDays,
          peakIncidentDay: highRiskDays[0] || 'Mon'
        },
        seasonalTrends: {
          highRiskMonths: ['December', 'January', 'February'],
          weatherCorrelation: 'High correlation with cold weather'
        }
      },
      mlPredictions: {
        incidentProbability,
        confidenceLevel,
        predictedType: incidentProbability > 50 ? 'equipment_failure' : 'minor_incident',
        predictedSeverity: incidentProbability > 70 ? 'high' : 'medium',
        contributingFactors: ['Equipment age', 'Maintenance backlog', 'Peak operational hours']
      },
      historicalComparison: {
        similarIncidentsPast: historicalAlerts.length,
        averageTimeBetweenIncidents: highRiskHours.length ? 7 : null,
        daysSinceLastIncident: lastIncidentDays,
        trendDirection: incidentProbability < 30 ? 'improving' : incidentProbability > 60 ? 'declining' : 'stable'
      }
    });

    await prediction.save();

    res.status(201).json({
      success: true,
      prediction,
      message: 'Incident prediction generated successfully'
    });

  } catch (error) {
    console.error('Error generating incident prediction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating incident prediction', 
      error: error.message 
    });
  }
};

// Get incident predictions for a mine
export const getIncidentPredictions = async (req, res) => {
  try {
    const { mineId } = req.params;
    const predictions = await IncidentPrediction.find({ mineId })
      .sort({ predictionDate: -1 })
      .limit(20);
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard analytics summary
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { mineId } = req.params;

    const [latestPrediction, recentAlerts, maintenanceStatus, maintenanceTasks] = await Promise.all([
      PredictiveAnalytics.findOne({ mineId }).sort({ analysisDate: -1 }),
      Alert.find({ createdBy: mineId, resolved: false }).limit(5),
      Maintenance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Maintenance.find({ mineId }),
    ]);

    const allAlerts = await Alert.find({
      createdBy: mineId,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const equipmentRisk = computeEquipmentRiskList(maintenanceTasks, allAlerts, mineId);

    res.json({
      success: true,
      analytics: {
        currentRiskScore: latestPrediction?.riskScore || 0,
        currentRiskLevel: latestPrediction?.riskLevel || 'low',
        unresolvedAlerts: recentAlerts.length,
        maintenanceStatus: maintenanceStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        lastAnalysis: latestPrediction?.analysisDate,
        recommendations: latestPrediction?.recommendations?.slice(0, 3) || [],
        equipmentRisk: equipmentRisk.slice(0, 12),
        riskFactors: latestPrediction?.factors || null,
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard analytics', 
      error: error.message 
    });
  }
};

export default {
  generateSafetyPrediction,
  getPredictions,
  getHighRiskMines,
  generateIncidentPrediction,
  getIncidentPredictions,
  getDashboardAnalytics
};
