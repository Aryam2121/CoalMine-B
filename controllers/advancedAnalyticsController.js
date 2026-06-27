import AdvancedAnalytics from '../models/AdvancedAnalytics.js';
import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import Resource from '../models/Resource.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import NearMissReport from '../models/NearMissReport.js';
import Productivity from '../models/Productivity.js';
import { Training } from '../models/Training.js';
import ComplianceRecord from '../models/ComplianceRecord.js';
import EmergencyResponse from '../models/EmergencyResponse.js';

// Generate comprehensive analytics report
export const generateAnalyticsReport = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { reportType = 'daily', startDate, endDate } = req.body;

    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date()
    };

    const periodMs = period.end - period.start;
    const prevPeriod = {
      start: new Date(period.start.getTime() - periodMs),
      end: new Date(period.start.getTime()),
    };

    // Fetch all required data in parallel
    const [
      alerts,
      prevAlerts,
      maintenance,
      resources,
      attendance,
      users,
      predictions,
      equipment,
      nearMisses,
      productivity,
      training,
      compliance,
      prevProductivity,
    ] = await Promise.all([
      Alert.find({
        createdBy: mineId,
        timestamp: { $gte: period.start, $lte: period.end },
      }),
      Alert.find({
        createdBy: mineId,
        timestamp: { $gte: prevPeriod.start, $lte: prevPeriod.end },
      }),
      Maintenance.find({
        mineId,
        date: { $gte: period.start, $lte: period.end },
      }),
      Resource.find({ mineId }),
      Attendance.find({
        date: { $gte: period.start, $lte: period.end },
      }),
      User.find(),
      PredictiveAnalytics.find({
        mineId,
        analysisDate: { $gte: period.start, $lte: period.end },
      }),
      Equipment.find({ mineId }),
      NearMissReport.find({ mineId, createdAt: { $gte: period.start, $lte: period.end } }),
      Productivity.find({ date: { $gte: period.start, $lte: period.end } }),
      Training.find({ mineId }),
      ComplianceRecord.find({ mineId }),
      EmergencyResponse.find({ mineId, createdAt: { $gte: period.start, $lte: period.end } }),
      Productivity.find({ date: { $gte: prevPeriod.start, $lte: prevPeriod.end } }),
    ]);

    const sumProductivity = (records) =>
      records.reduce((sum, r) => {
        const vals = Array.isArray(r.value) ? r.value : [r.value];
        return sum + vals.reduce((s, n) => s + (Number(n) || 0), 0);
      }, 0);

    const totalProduction = Math.round(sumProductivity(productivity));
    const prevProduction = Math.round(sumProductivity(prevProductivity));
    const productionTarget = Math.max(totalProduction, prevProduction, 1);
    const achievementRate = ((totalProduction / productionTarget) * 100).toFixed(2);
    const productionGrowth =
      prevProduction > 0
        ? Math.round(((totalProduction - prevProduction) / prevProduction) * 100)
        : 0;

    // Calculate safety metrics
    const incidentCount = alerts.filter((a) => a.type === 'critical').length;
    const nearMissCount = nearMisses.length;
    const daysInPeriod = Math.max(1, Math.ceil(periodMs / (1000 * 60 * 60 * 24)));
    const incidentRate = incidentCount > 0 ? (incidentCount / daysInPeriod).toFixed(2) : 0;
    const safetyScore = Math.max(0, 100 - incidentCount * 10 - nearMissCount * 3);

    const lastEmergency = await EmergencyResponse.findOne({ mineId })
      .sort({ createdAt: -1 })
      .select('createdAt');
    const daysWithoutIncident = lastEmergency
      ? Math.floor((Date.now() - new Date(lastEmergency.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : daysInPeriod;

    const validCompliance = compliance.filter((c) => c.status === 'valid').length;
    const complianceRate =
      compliance.length > 0 ? Math.round((validCompliance / compliance.length) * 100) : 100;

    const prevCritical = prevAlerts.filter((a) => a.type === 'critical').length;
    const safetyTrendPct =
      prevCritical > 0
        ? Math.round(((prevCritical - incidentCount) / prevCritical) * 100)
        : incidentCount === 0
          ? 0
          : -100;

    // Calculate workforce metrics
    const totalEmployees = users.length;
    const activeEmployees = attendance.filter((a) => a.status === 'Present').length;
    const attendanceRate = totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(2) : 0;
    const absenteeismRate = (100 - Number(attendanceRate)).toFixed(2);

    const completedTraining = training.filter((t) => t.status === 'completed' || t.completed).length;
    const trainingCompletionRate =
      training.length > 0 ? Math.round((completedTraining / training.length) * 100) : 0;

    const taskCompletionRate =
      maintenance.length > 0
        ? Math.round(
            (maintenance.filter((m) => m.status === 'completed').length / maintenance.length) * 100
          )
        : 0;

    // Equipment metrics from registry
    const totalEquipment = equipment.length || maintenance.filter((m) => m.equipmentId).length;
    const operationalEquipment = equipment.filter((e) => e.status === 'operational').length;
    const underMaintenance = equipment.filter((e) => e.status === 'maintenance').length +
      maintenance.filter((m) => m.status === 'in-progress').length;
    const utilization =
      totalEquipment > 0 ? ((operationalEquipment / totalEquipment) * 100).toFixed(2) : '0';

    const maintenanceCost = maintenance.reduce(
      (sum, m) => sum + (m.cost?.actual || m.cost?.estimated || 0),
      0
    );
    const downtimeHours = maintenance
      .filter((m) => ['overdue', 'in-progress'].includes(m.status))
      .reduce((sum, m) => sum + (m.estimatedDuration || 4), 0);

    // Financial metrics from resources + maintenance
    const operatingCost = Math.round(maintenanceCost + resources.reduce((s, r) => s + (r.used || 0) * 100, 0));
    const revenue = Math.round(totalProduction * 120);
    const profitMargin = revenue > 0 ? (((revenue - operatingCost) / revenue) * 100).toFixed(2) : '0';

    // Generate KPIs
    const kpis = [
      {
        name: 'Production Efficiency',
        value: achievementRate,
        target: 100,
        unit: '%',
        status: achievementRate >= 90 ? 'on_track' : achievementRate >= 70 ? 'at_risk' : 'off_track',
        trend: 'improving'
      },
      {
        name: 'Safety Score',
        value: safetyScore,
        target: 95,
        unit: 'points',
        status: safetyScore >= 90 ? 'on_track' : safetyScore >= 70 ? 'at_risk' : 'off_track',
        trend: incidentCount === 0 ? 'improving' : 'declining'
      },
      {
        name: 'Attendance Rate',
        value: attendanceRate,
        target: 95,
        unit: '%',
        status: attendanceRate >= 90 ? 'on_track' : attendanceRate >= 80 ? 'at_risk' : 'off_track',
        trend: 'stable'
      },
      {
        name: 'Equipment Utilization',
        value: utilization,
        target: 85,
        unit: '%',
        status: utilization >= 80 ? 'on_track' : utilization >= 60 ? 'at_risk' : 'off_track',
        trend: 'improving'
      }
    ];

    // Generate insights
    const insights = [];
    
    if (incidentCount > 3) {
      insights.push({
        category: 'safety',
        insight: `High incident rate detected (${incidentCount} incidents in ${daysInPeriod} days). Immediate review of safety protocols required.`,
        priority: 'critical',
        actionItems: [
          'Conduct emergency safety audit',
          'Review and update safety procedures',
          'Increase safety training frequency'
        ]
      });
    }

    if (achievementRate < 70) {
      insights.push({
        category: 'productivity',
        insight: `Production below target by ${(100 - achievementRate).toFixed(1)}%. Consider optimization strategies.`,
        priority: 'high',
        actionItems: [
          'Analyze production bottlenecks',
          'Optimize shift schedules',
          'Review equipment performance'
        ]
      });
    }

    if (resources.some(r => (r.used || 0) > 90)) {
      insights.push({
        category: 'resources',
        insight: 'Critical resource shortage detected. Immediate restocking required.',
        priority: 'high',
        actionItems: [
          'Prioritize resource procurement',
          'Implement resource tracking',
          'Set up automated reorder alerts'
        ]
      });
    }

    // Create analytics report
    const report = new AdvancedAnalytics({
      mineId,
      reportType,
      period,
      productivity: {
        totalProduction,
        productionTarget,
        achievementRate: parseFloat(achievementRate),
        trendsAnalysis: {
          comparedToPreviousPeriod: productionGrowth,
          growthRate: Math.max(0, productionGrowth),
          prediction: Math.round(totalProduction * (1 + productionGrowth / 100)),
        },
      },
      safety: {
        incidentCount,
        incidentRate: parseFloat(incidentRate),
        nearMissCount,
        daysWithoutIncident,
        safetyScore,
        complianceRate,
        byCategory: [
          { category: 'equipment', count: nearMisses.filter((n) => n.category === 'equipment').length, severity: 'medium' },
          { category: 'gas', count: nearMisses.filter((n) => n.category === 'gas').length, severity: 'high' },
          { category: 'structural', count: nearMisses.filter((n) => n.category === 'structural').length, severity: 'low' },
        ],
        trends: {
          improving: incidentCount <= prevCritical,
          percentageChange: safetyTrendPct,
        },
      },
      workforce: {
        totalEmployees,
        activeEmployees,
        attendanceRate: parseFloat(attendanceRate),
        absenteeismRate: parseFloat(absenteeismRate),
        averageExperience: 7.5,
        trainingCompletionRate,
        performanceMetrics: {
          averageProductivity: parseFloat(achievementRate),
          safetyCompliance: complianceRate,
          taskCompletionRate,
        },
      },
      equipment: {
        totalEquipment,
        operationalEquipment,
        underMaintenance,
        utilization: parseFloat(utilization),
        downtime: downtimeHours,
        maintenanceCost,
      },
      financial: {
        operatingCost,
        revenue,
        profitMargin: parseFloat(profitMargin),
        costPerTon: (operatingCost / totalProduction).toFixed(2)
      },
      environmental: {
        emissionsLevel: resources.filter((r) => r.type === 'emissions').reduce((s, r) => s + (r.used || 0), 0),
        waterUsage: resources.filter((r) => r.type === 'water').reduce((s, r) => s + (r.used || 0), 0),
        wasteGenerated: resources.filter((r) => r.type === 'waste').reduce((s, r) => s + (r.used || 0), 0),
        complianceStatus: complianceRate >= 80 ? 'compliant' : 'review_required',
        improvementAreas: complianceRate < 90 ? ['Certificate renewals', 'Inspection scheduling'] : ['Water recycling'],
      },
      kpi: kpis,
      insights,
      benchmarking: {
        industryAverage: 85,
        rankingPercentile: 72,
        bestPractices: [
          'Implement predictive maintenance',
          'Adopt real-time monitoring systems',
          'Enhance worker training programs'
        ],
        improvementOpportunities: [
          'Increase automation',
          'Optimize resource allocation',
          'Enhance safety protocols'
        ]
      },
      generatedBy: req.user?._id
    });

    await report.save();

    res.status(201).json({
      success: true,
      report,
      message: 'Analytics report generated successfully'
    });

  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analytics report',
      error: error.message
    });
  }
};

// Get latest analytics report
export const getLatestReport = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { reportType = 'daily' } = req.query;

    const report = await AdvancedAnalytics.getLatestReport(mineId, reportType);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No reports found'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// Get all reports for a mine
export const getAllReports = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { reportType, limit = 10, page = 1 } = req.query;

    const query = { mineId };
    if (reportType) query.reportType = reportType;

    const reports = await AdvancedAnalytics.find(query)
      .sort({ reportDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('generatedBy');

    const total = await AdvancedAnalytics.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// Export report in different formats
export const exportReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query; // json, csv, pdf

    const report = await AdvancedAnalytics.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update export record
    report.exportedFormats.push({
      format,
      exportedAt: new Date(),
      fileUrl: `/exports/${id}.${format}`
    });
    await report.save();

    // In production, generate actual file
    if (format === 'json') {
      res.json({
        success: true,
        report
      });
    } else {
      res.json({
        success: true,
        message: `Report exported as ${format}`,
        downloadUrl: `/exports/${id}.${format}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
};

export default {
  generateAnalyticsReport,
  getLatestReport,
  getAllReports,
  exportReport
};
