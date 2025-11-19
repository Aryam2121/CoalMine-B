import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import RealTimeMonitoring from '../models/RealTimeMonitoring.js';
import EmergencyResponse from '../models/EmergencyResponse.js';
import Alert from '../models/Alert.js';

let io;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join mine-specific room
    socket.on('join:mine', (mineId) => {
      socket.join(`mine:${mineId}`);
      console.log(`User ${socket.userId} joined mine room: ${mineId}`);
    });

    // Leave mine room
    socket.on('leave:mine', (mineId) => {
      socket.leave(`mine:${mineId}`);
    });

    // Real-time location tracking
    socket.on('location:update', async (data) => {
      const { mineId, userId, location, vitalSigns } = data;
      
      try {
        let monitoring = await RealTimeMonitoring.findOne({ mineId }).sort({ timestamp: -1 });
        
        if (!monitoring) {
          monitoring = new RealTimeMonitoring({ mineId, activePersonnel: [] });
        }

        // Update personnel location
        const personIndex = monitoring.activePersonnel.findIndex(
          p => p.userId.toString() === userId
        );

        if (personIndex >= 0) {
          monitoring.activePersonnel[personIndex].location = location;
          monitoring.activePersonnel[personIndex].lastUpdate = new Date();
          if (vitalSigns) {
            monitoring.activePersonnel[personIndex].vitalSigns = vitalSigns;
          }
        }

        await monitoring.save();

        // Broadcast to mine room
        io.to(`mine:${mineId}`).emit('location:updated', {
          userId,
          location,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    // Emergency SOS
    socket.on('emergency:sos', async (data) => {
      const { mineId, emergencyType, location, description } = data;
      
      try {
        const emergency = new EmergencyResponse({
          mineId,
          reportedBy: socket.userId,
          emergencyType,
          severity: 'critical',
          location,
          description: description || 'SOS Emergency Alert',
          status: 'active'
        });

        await emergency.save();

        // Create system alert
        await Alert.create({
          message: `🚨 SOS EMERGENCY: ${emergencyType} at ${location?.area || 'Unknown Location'}`,
          type: 'critical',
          createdBy: mineId
        });

        // Broadcast to all users in mine
        io.to(`mine:${mineId}`).emit('emergency:alert', {
          emergency,
          timestamp: new Date()
        });

        // Notify administrators
        io.emit('emergency:admin', {
          emergency,
          mineId
        });

        socket.emit('emergency:confirmed', {
          emergencyId: emergency.emergencyId,
          message: 'Emergency response initiated'
        });
      } catch (error) {
        console.error('Error handling SOS:', error);
        socket.emit('emergency:error', { message: 'Failed to process emergency' });
      }
    });

    // Real-time alerts
    socket.on('alert:create', async (data) => {
      const { mineId, message, type } = data;
      
      try {
        const alert = await Alert.create({
          message,
          type,
          createdBy: mineId
        });

        // Broadcast to mine room
        io.to(`mine:${mineId}`).emit('alert:new', alert);
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    });

    // Alert acknowledged
    socket.on('alert:acknowledge', async (data) => {
      const { alertId, mineId } = data;
      
      try {
        const alert = await Alert.findById(alertId);
        if (alert && !alert.resolved) {
          await alert.resolve(socket.userId);
          
          io.to(`mine:${mineId}`).emit('alert:resolved', {
            alertId,
            resolvedBy: socket.userId,
            resolvedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error acknowledging alert:', error);
      }
    });

    // Equipment status update
    socket.on('equipment:status', async (data) => {
      const { mineId, equipmentId, status, metrics } = data;
      
      try {
        let monitoring = await RealTimeMonitoring.findOne({ mineId }).sort({ timestamp: -1 });
        
        if (monitoring) {
          const equipmentIndex = monitoring.equipmentStatus.findIndex(
            e => e.equipmentId === equipmentId
          );

          if (equipmentIndex >= 0) {
            monitoring.equipmentStatus[equipmentIndex].status = status;
            monitoring.equipmentStatus[equipmentIndex].metrics = metrics;
            await monitoring.save();
          }

          // Broadcast equipment update
          io.to(`mine:${mineId}`).emit('equipment:updated', {
            equipmentId,
            status,
            metrics,
            timestamp: new Date()
          });

          // If equipment is in warning or malfunction, create alert
          if (status === 'warning' || status === 'malfunction') {
            await Alert.create({
              message: `Equipment Alert: ${equipmentId} status changed to ${status}`,
              type: status === 'malfunction' ? 'critical' : 'warning',
              createdBy: mineId
            });

            io.to(`mine:${mineId}`).emit('equipment:alert', {
              equipmentId,
              status
            });
          }
        }
      } catch (error) {
        console.error('Error updating equipment status:', error);
      }
    });

    // Chat/Communication
    socket.on('chat:message', (data) => {
      const { mineId, message, channel } = data;
      
      io.to(`mine:${mineId}`).emit('chat:new', {
        from: socket.userId,
        message,
        channel: channel || 'general',
        timestamp: new Date()
      });
    });

    // Environmental monitoring updates
    socket.on('environment:update', async (data) => {
      const { mineId, conditions } = data;
      
      try {
        let monitoring = await RealTimeMonitoring.findOne({ mineId }).sort({ timestamp: -1 });
        
        if (monitoring) {
          monitoring.environmentalConditions = {
            ...monitoring.environmentalConditions,
            ...conditions
          };
          await monitoring.save();

          io.to(`mine:${mineId}`).emit('environment:updated', {
            conditions,
            timestamp: new Date()
          });

          // Check for dangerous levels
          if (conditions.gasLevels) {
            const { methane, carbonMonoxide } = conditions.gasLevels;
            if (methane > 1.5 || carbonMonoxide > 50) {
              await Alert.create({
                message: `⚠️ Dangerous gas levels detected! CH4: ${methane}%, CO: ${carbonMonoxide}ppm`,
                type: 'critical',
                createdBy: mineId
              });

              io.to(`mine:${mineId}`).emit('environment:danger', {
                gasLevels: conditions.gasLevels,
                message: 'Evacuation may be required'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error updating environment:', error);
      }
    });

    // Notification system
    socket.on('notification:send', (data) => {
      const { target, notification } = data;
      
      if (target === 'broadcast') {
        io.emit('notification:receive', notification);
      } else if (target.startsWith('mine:')) {
        io.to(target).emit('notification:receive', notification);
      } else if (target.startsWith('user:')) {
        const userId = target.split(':')[1];
        io.to(userId).emit('notification:receive', notification);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Utility functions to emit events from controllers
export const emitToMine = (mineId, event, data) => {
  if (io) {
    io.to(`mine:${mineId}`).emit(event, data);
  }
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

export default { initializeSocket, emitToMine, emitToAll, emitToUser };
