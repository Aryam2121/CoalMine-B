import AdvancedAnalytics from '../models/AdvancedAnalytics.js';
import PredictiveAnalytics from '../models/PredictiveAnalytics.js';
import Alert from '../models/Alert.js';
import Maintenance from '../models/Maintenance.js';
import Resource from '../models/Resource.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Generate comprehensive analytics report
export const generateAnalyticsReport = async (req, res) => {
  try {
    const { mineId } = req.params;
    const { reportType = 'daily', startDate, endDate } = req.body;

    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date()
    };

    // Fetch all required data in parallel
    const [alerts, maintenance, resources, attendance, users, predictions] = await Promise.all([
      Alert.find({
        createdBy: mineId,
        timestamp: { $gte: period.start, $lte: period.end }
      }),
      Maintenance.find({
        mineId,
        date: { $gte: period.start, $lte: period.end }
      }),
      Resource.find({ mineId }),
      Attendance.find({
        date: { $gte: period.start, $lte: period.end }
      }),
      User.find(),
      PredictiveAnalytics.find({
        mineId,
        analysisDate: { $gte: period.start, $lte: period.end }
      })
    ]);

    // Calculate productivity metrics
    const totalProduction = Math.floor(Math.random() * 10000) + 5000; // Simulated
    const productionTarget = 10000;
    const achievementRate = (totalProduction / productionTarget * 100).toFixed(2);

    // Calculate safety metrics
    const incidentCount = alerts.filter(a => a.type === 'critical').length;
    const nearMissCount = alerts.filter(a => a.type === 'warning').length;
    const daysInPeriod = Math.ceil((period.end - period.start) / (1000 * 60 * 60 * 24));
    const incidentRate = incidentCount > 0 ? (incidentCount / daysInPeriod).toFixed(2) : 0;
    const safetyScore = Math.max(0, 100 - (incidentCount * 10 + nearMissCount * 5));

    // Calculate workforce metrics
    const totalEmployees = users.length;
    const activeEmployees = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalEmployees > 0 ? (activeEmployees / totalEmployees * 100).toFixed(2) : 0;
    const absenteeismRate = (100 - attendanceRate).toFixed(2);

    // Equipment metrics
    const totalEquipment = 50; // Simulated
    const operationalEquipment = 42;
    const underMaintenance = maintenance.filter(m => m.status === 'in-progress').length;
    const utilization = (operationalEquipment / totalEquipment * 100).toFixed(2);

    // Financial metrics (simulated)
    const operatingCost = Math.floor(Math.random() * 500000) + 200000;
    const revenue = Math.floor(Math.random() * 800000) + 400000;
    const profitMargin = ((revenue - operatingCost) / revenue * 100).toFixed(2);

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

    if (resources.some(r => r.status === 'critical' || r.status === 'depleted')) {
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
          comparedToPreviousPeriod: Math.floor(Math.random() * 20) - 10,
          growthRate: Math.floor(Math.random() * 15),
          prediction: totalProduction * 1.1
        }
      },
      safety: {
        incidentCount,
        incidentRate: parseFloat(incidentRate),
        nearMissCount,
        daysWithoutIncident: incidentCount === 0 ? daysInPeriod : 0,
        safetyScore,
        complianceRate: 85 + Math.floor(Math.random() * 15),
        byCategory: [
          { category: 'equipment', count: Math.floor(incidentCount * 0.4), severity: 'medium' },
          { category: 'gas_leak', count: Math.floor(incidentCount * 0.3), severity: 'high' },
          { category: 'structural', count: Math.floor(incidentCount * 0.3), severity: 'low' }
        ],
        trends: {
          improving: incidentCount < 2,
          percentageChange: -15 + Math.floor(Math.random() * 30)
        }
      },
      workforce: {
        totalEmployees,
        activeEmployees,
        attendanceRate: parseFloat(attendanceRate),
        absenteeismRate: parseFloat(absenteeismRate),
        averageExperience: 7.5,
        trainingCompletionRate: 65 + Math.floor(Math.random() * 30),
        performanceMetrics: {
          averageProductivity: 75 + Math.floor(Math.random() * 20),
          safetyCompliance: 85 + Math.floor(Math.random() * 10),
          taskCompletionRate: 80 + Math.floor(Math.random() * 15)
        }
      },
      equipment: {
        totalEquipment,
        operationalEquipment,
        underMaintenance,
        utilization: parseFloat(utilization),
        downtime: Math.floor(Math.random() * 100),
        maintenanceCost: Math.floor(Math.random() * 50000) + 10000
      },
      financial: {
        operatingCost,
        revenue,
        profitMargin: parseFloat(profitMargin),
        costPerTon: (operatingCost / totalProduction).toFixed(2)
      },
      environmental: {
        emissionsLevel: 150 + Math.floor(Math.random() * 100),
        waterUsage: 5000 + Math.floor(Math.random() * 2000),
        wasteGenerated: 500 + Math.floor(Math.random() * 300),
        complianceStatus: 'compliant',
        improvementAreas: ['Water recycling', 'Emission reduction']
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
