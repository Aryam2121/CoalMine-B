import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import IncidentPrediction from '../models/IncidentPrediction.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import mongoose from 'mongoose';

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
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
    });

    // Calculate risk factors
    const criticalAlerts = recentAlerts.filter(a => a.type === 'critical').length;
    const unresolvedAlerts = recentAlerts.filter(a => !a.resolved).length;
    const overdueMaintenanceTasks = maintenanceTasks.filter(
      m => m.status !== 'completed' && m.date < new Date()
    ).length;

    // Simple ML-like scoring algorithm (can be replaced with actual ML model)
    const riskScore = Math.min(100, 
      (criticalAlerts * 15) + 
      (unresolvedAlerts * 10) + 
      (overdueMaintenanceTasks * 12) +
      Math.floor(Math.random() * 20) // Simulated variance
    );

    let riskLevel = 'low';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';

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

    // Create prediction record
    const prediction = new PredictiveAnalytics({
      mineId,
      riskScore,
      riskLevel,
      predictedIncidents,
      factors: {
        weatherConditions: {
          temperature: 25 + Math.random() * 10,
          humidity: 60 + Math.random() * 20,
          rainfall: Math.random() * 50,
          windSpeed: 10 + Math.random() * 15
        },
        operationalFactors: {
          hoursOperated: 168,
          maintenanceOverdue: overdueMaintenanceTasks,
          staffFatigue: Math.floor(Math.random() * 100),
          equipmentAge: 5 + Math.random() * 10
        },
        historicalData: {
          pastIncidents: recentAlerts.length,
          daysWithoutIncident: Math.floor(Math.random() * 30),
          averageResponseTime: 15 + Math.random() * 30
        }
      },
      recommendations,
      mlModelVersion: '1.0.0',
      confidence: 75 + Math.floor(Math.random() * 20)
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

    const incidentProbability = Math.min(95, 
      (historicalAlerts.filter(a => a.type === 'critical').length / Math.max(historicalAlerts.length, 1)) * 100
    );

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
        confidenceLevel: 70 + Math.floor(Math.random() * 20),
        predictedType: incidentProbability > 50 ? 'equipment_failure' : 'minor_incident',
        predictedSeverity: incidentProbability > 70 ? 'high' : 'medium',
        contributingFactors: ['Equipment age', 'Weather conditions', 'Peak operational hours']
      },
      historicalComparison: {
        similarIncidentsPast: historicalAlerts.length,
        averageTimeBetweenIncidents: 7,
        daysSinceLastIncident: Math.floor(Math.random() * 14),
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

// Get dashboard analytics summary
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { mineId } = req.params;

    const [latestPrediction, recentAlerts, maintenanceStatus] = await Promise.all([
      PredictiveAnalytics.findOne({ mineId }).sort({ analysisDate: -1 }),
      Alert.find({ createdBy: mineId, resolved: false }).limit(5),
      Maintenance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

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
        recommendations: latestPrediction?.recommendations?.slice(0, 3) || []
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
  getDashboardAnalytics
};
