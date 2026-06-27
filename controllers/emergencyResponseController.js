import EmergencyResponse from '../models/EmergencyResponse.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import RealTimeMonitoring from '../models/RealTimeMonitoring.js';
import mongoose from 'mongoose';
import { emitToMine, emitToAll } from '../utils/socketHandler.js';
import { notifyEmergency, notifyEvacuation } from '../services/pushNotificationService.js';

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

    emitToMine(String(mineId), 'emergency:alert', { emergency, timestamp: new Date() });
    emitToAll('emergency:admin', { emergency, mineId });
    notifyEmergency(mineId, emergency).catch(() => {});

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
    const { personnelCount, evacuationRoutes, musterPoints } = req.body;

    const emergency = await EmergencyResponse.findById(id);
    
    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    const monitoring = await RealTimeMonitoring.findOne({ mineId: emergency.mineId }).sort({ timestamp: -1 });
    const activePersonnel = monitoring?.activePersonnel || [];

    const musterRoll = activePersonnel.map((p) => ({
      userId: p.userId,
      name: p.name,
      status: 'missing',
    }));

    emergency.evacuationStatus = {
      initiated: true,
      personnelEvacuated: 0,
      personnelRemaining: personnelCount || activePersonnel.length || emergency.affectedPersonnel.length,
      evacuationRoutes: evacuationRoutes || ['Main Exit', 'Emergency Exit A'],
      musterPoints: musterPoints || [
        { name: 'Muster Point A', latitude: 0, longitude: 0, radiusMeters: 50 },
        { name: 'Muster Point B', latitude: 0, longitude: 0, radiusMeters: 50 },
      ],
      musterRoll,
    };

    emergency.timeline.push({
      event: 'Evacuation initiated',
      performedBy: req.user?._id,
      notes: `Evacuation of ${emergency.evacuationStatus.personnelRemaining} personnel initiated`,
    });

    await emergency.save();

    await Alert.create({
      message: `⚠️ EVACUATION INITIATED - Emergency ID: ${emergency.emergencyId}`,
      type: 'critical',
      createdBy: emergency.mineId,
    });

    emitToMine(String(emergency.mineId), 'evacuation:initiated', { emergency });
    emitToAll('evacuation:initiated', { emergency, mineId: emergency.mineId });
    notifyEvacuation(emergency.mineId, emergency._id).catch(() => {});

    res.json({
      success: true,
      emergency,
      message: 'Evacuation initiated successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error initiating evacuation', 
      error: error.message 
    });
  }
};

// Worker reports safe at muster point
export const reportMusterSafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { musterPoint, location } = req.body;
    const userId = req.user._id;

    const emergency = await EmergencyResponse.findById(id);
    if (!emergency?.evacuationStatus?.initiated) {
      return res.status(400).json({ success: false, message: 'No active evacuation' });
    }

    const roll = emergency.evacuationStatus.musterRoll || [];
    const idx = roll.findIndex((r) => String(r.userId) === String(userId));
    const entry = {
      userId,
      name: req.user.name,
      status: 'safe',
      musterPoint: musterPoint || 'Unknown',
      reportedAt: new Date(),
      location,
    };

    if (idx >= 0) roll[idx] = { ...roll[idx].toObject?.() || roll[idx], ...entry };
    else roll.push(entry);

    emergency.evacuationStatus.musterRoll = roll;
    emergency.evacuationStatus.personnelEvacuated = roll.filter((r) => r.status === 'safe' || r.status === 'evacuated').length;
    emergency.evacuationStatus.personnelRemaining = Math.max(
      0,
      (emergency.evacuationStatus.personnelRemaining || roll.length) - emergency.evacuationStatus.personnelEvacuated
    );

    await emergency.save();

    emitToMine(String(emergency.mineId), 'muster:updated', { emergencyId: id, roll, entry });

    res.json({ success: true, emergency, message: 'Muster status reported' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manager updates personnel muster status
export const updateMusterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status, musterPoint } = req.body;

    const emergency = await EmergencyResponse.findById(id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

    const roll = emergency.evacuationStatus?.musterRoll || [];
    const idx = roll.findIndex((r) => String(r.userId) === String(userId));
    if (idx < 0) return res.status(404).json({ success: false, message: 'Personnel not in roll' });

    roll[idx].status = status;
    if (musterPoint) roll[idx].musterPoint = musterPoint;
    roll[idx].reportedAt = new Date();

    emergency.evacuationStatus.musterRoll = roll;
    emergency.evacuationStatus.personnelEvacuated = roll.filter((r) => ['safe', 'evacuated'].includes(r.status)).length;
    emergency.evacuationStatus.personnelRemaining = Math.max(0, roll.length - emergency.evacuationStatus.personnelEvacuated);

    await emergency.save();
    emitToMine(String(emergency.mineId), 'muster:updated', { emergencyId: id, roll });

    res.json({ success: true, emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get muster status
export const getMusterStatus = async (req, res) => {
  try {
    const emergency = await EmergencyResponse.findById(req.params.id)
      .populate('evacuationStatus.musterRoll.userId', 'name role email');
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

    res.json({
      success: true,
      evacuation: emergency.evacuationStatus,
      emergencyId: emergency.emergencyId,
      status: emergency.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete evacuation
export const completeEvacuation = async (req, res) => {
  try {
    const emergency = await EmergencyResponse.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

    emergency.evacuationStatus.completedAt = new Date();
    emergency.timeline.push({
      event: 'Evacuation completed',
      performedBy: req.user?._id,
      notes: req.body.notes || 'All personnel accounted for',
    });
    await emergency.save();

    emitToMine(String(emergency.mineId), 'evacuation:completed', { emergencyId: emergency._id });
    res.json({ success: true, emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  reportMusterSafe,
  updateMusterStatus,
  getMusterStatus,
  completeEvacuation,
  submitPostIncidentReport
};
