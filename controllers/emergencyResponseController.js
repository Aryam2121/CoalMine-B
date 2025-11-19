import EmergencyResponse from '../models/EmergencyResponse.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import mongoose from 'mongoose';

// Create Emergency SOS
export const createEmergency = async (req, res) => {
  try {
    const {
      mineId,
      emergencyType,
      severity,
      location,
      description,
      affectedPersonnel
    } = req.body;

    // Validation
    if (!mineId || !emergencyType || !severity || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mineId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid mine ID' 
      });
    }

    const reportedBy = req.user?._id || req.body.reportedBy;

    // Create emergency response
    const emergency = new EmergencyResponse({
      mineId,
      reportedBy,
      emergencyType,
      severity,
      location,
      description,
      affectedPersonnel: affectedPersonnel || [],
      timeline: [{
        event: 'Emergency reported',
        performedBy: reportedBy,
        notes: `Emergency type: ${emergencyType}, Severity: ${severity}`
      }]
    });

    await emergency.save();

    // Create critical alert
    await Alert.create({
      message: `🚨 EMERGENCY: ${emergencyType.replace('_', ' ').toUpperCase()} - ${description.substring(0, 100)}`,
      type: 'critical',
      createdBy: mineId
    });

    // TODO: Send real-time notifications via WebSocket
    // TODO: Trigger SMS/Email alerts to emergency contacts
    // TODO: Alert nearby response teams

    res.status(201).json({
      success: true,
      emergency,
      message: 'Emergency response initiated. All relevant personnel have been notified.'
    });

  } catch (error) {
    console.error('Error creating emergency:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating emergency response', 
      error: error.message 
    });
  }
};

// Get all emergencies with filtering
export const getAllEmergencies = async (req, res) => {
  try {
    const { mineId, status, severity, page = 1, limit = 20 } = req.query;

    const query = {};
    if (mineId) query.mineId = mineId;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const emergencies = await EmergencyResponse.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('mineId reportedBy responseTeam.userId affectedPersonnel.userId');

    const total = await EmergencyResponse.countDocuments(query);

    res.json({
      success: true,
      emergencies,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching emergencies', 
      error: error.message 
    });
  }
};

// Get active emergencies
export const getActiveEmergencies = async (req, res) => {
  try {
    const activeEmergencies = await EmergencyResponse.getActiveEmergencies();

    res.json({
      success: true,
      count: activeEmergencies.length,
      emergencies: activeEmergencies
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching active emergencies', 
      error: error.message 
    });
  }
};

// Get emergency by ID
export const getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;

    const emergency = await EmergencyResponse.findById(id)
      .populate('mineId reportedBy resolvedBy responseTeam.userId affectedPersonnel.userId');

    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    res.json({
      success: true,
      emergency
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching emergency', 
      error: error.message 
    });
  }
};

// Update emergency status
export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?._id || req.body.userId;

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    await emergency.updateStatus(status, userId);
    
    if (notes) {
      emergency.timeline.push({
        event: `Status update: ${status}`,
        performedBy: userId,
        notes
      });
      await emergency.save();
    }

    res.json({
      success: true,
      emergency,
      message: `Emergency status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating emergency status', 
      error: error.message 
    });
  }
};

// Assign response team
export const assignResponseTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamMembers } = req.body; // Array of { userId, role }

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    // Add team members
    teamMembers.forEach(member => {
      emergency.responseTeam.push({
        userId: member.userId,
        role: member.role,
        status: 'assigned'
      });
    });

    emergency.timeline.push({
      event: 'Response team assigned',
      notes: `${teamMembers.length} team members assigned`
    });

    await emergency.save();

    res.json({
      success: true,
      emergency,
      message: 'Response team assigned successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error assigning response team', 
      error: error.message 
    });
  }
};

// Add communication log
export const addCommunicationLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, channel } = req.body;
    const from = req.user?._id || req.body.from;

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    emergency.communicationLog.push({
      from,
      message,
      channel: channel || 'web'
    });

    await emergency.save();

    res.json({
      success: true,
      message: 'Communication logged successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error logging communication', 
      error: error.message 
    });
  }
};

// Initiate evacuation
export const initiateEvacuation = async (req, res) => {
  try {
    const { id } = req.params;
    const { personnelCount, evacuationRoutes } = req.body;

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    emergency.evacuationStatus = {
      initiated: true,
      personnelEvacuated: 0,
      personnelRemaining: personnelCount || emergency.affectedPersonnel.length,
      evacuationRoutes: evacuationRoutes || ['Main Exit', 'Emergency Exit A']
    };

    emergency.timeline.push({
      event: 'Evacuation initiated',
      notes: `Evacuation of ${personnelCount} personnel initiated`
    });

    await emergency.save();

    // Create high-priority alert
    await Alert.create({
      message: `⚠️ EVACUATION INITIATED - Emergency ID: ${emergency.emergencyId}`,
      type: 'critical',
      createdBy: emergency.mineId
    });

    res.json({
      success: true,
      emergency,
      message: 'Evacuation initiated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error initiating evacuation', 
      error: error.message 
    });
  }
};

// Complete post-incident report
export const submitPostIncidentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { rootCause, contributingFactors, lessonsLearned, preventiveMeasures, estimatedDamage, downtime } = req.body;

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    if (emergency.status !== 'resolved') {
      return res.status(400).json({ 
        success: false,
        message: 'Emergency must be resolved before submitting post-incident report' 
      });
    }

    emergency.postIncidentReport = {
      rootCause,
      contributingFactors,
      lessonsLearned,
      preventiveMeasures,
      estimatedDamage,
      downtime
    };

    await emergency.save();

    res.json({
      success: true,
      emergency,
      message: 'Post-incident report submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error submitting post-incident report', 
      error: error.message 
    });
  }
};

export default {
  createEmergency,
  getAllEmergencies,
  getActiveEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignResponseTeam,
  addCommunicationLog,
  initiateEvacuation,
  submitPostIncidentReport
};
