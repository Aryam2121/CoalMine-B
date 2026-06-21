import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import RealTimeMonitoring from '../models/RealTimeMonitoring.js';
import EmergencyResponse from '../models/EmergencyResponse.js';
import Alert from '../models/Alert.js';
import {
  initSocketAuthState,
  authorizeMineJoin,
  authorizeMineEvent,
  authorizePermission,
  authorizeManager,
  authorizeAdmin,
  authorizeSelfUserId,
  deny,
  normalizeMineId,
  PERMISSIONS,
} from './socketAuth.js';

let io;

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        process.env.CLIENT_URL,
      ].filter(Boolean),
      credentials: true,
    },
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
    initSocketAuthState(socket);
    console.log(`User connected: ${socket.userId}`);

    // Join mine-specific room
    socket.on('join:mine', async (mineId, ack) => {
      try {
        const auth = await authorizeMineJoin(socket, mineId);
        if (!auth.ok) {
          deny(socket, auth.errorEvent, auth.message);
          if (typeof ack === 'function') ack({ ok: false, message: auth.message });
          return;
        }

        socket.join(`mine:${auth.mineId}`);
        socket.allowedMines.add(auth.mineId);
        console.log(`User ${socket.userId} joined mine room: ${auth.mineId}`);
        if (typeof ack === 'function') ack({ ok: true, mineId: auth.mineId });
      } catch (error) {
        console.error('Error joining mine room:', error);
        deny(socket, 'join:mine:error', 'Failed to join mine room');
        if (typeof ack === 'function') ack({ ok: false, message: 'Failed to join mine room' });
      }
    });

    // Leave mine room
    socket.on('leave:mine', (mineId) => {
      const id = normalizeMineId(mineId);
      if (!id) return;
      socket.leave(`mine:${id}`);
      socket.allowedMines.delete(id);
    });

    // Real-time location tracking
    socket.on('location:update', async (data) => {
      const { mineId, userId, location, vitalSigns } = data || {};

      try {
        const mineAuth = await authorizeMineEvent(socket, mineId, {
          errorEvent: 'location:update:error',
        });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        const selfAuth = authorizeSelfUserId(socket, userId, 'location:update:error');
        if (!selfAuth.ok) {
          deny(socket, selfAuth.errorEvent, selfAuth.message);
          return;
        }

        let monitoring = await RealTimeMonitoring.findOne({ mineId: mineAuth.mineId }).sort({
          timestamp: -1,
        });

        if (!monitoring) {
          monitoring = new RealTimeMonitoring({ mineId: mineAuth.mineId, activePersonnel: [] });
        }

        const personIndex = monitoring.activePersonnel.findIndex(
          (p) => p.userId.toString() === String(socket.userId)
        );

        if (personIndex >= 0) {
          monitoring.activePersonnel[personIndex].location = location;
          monitoring.activePersonnel[personIndex].lastUpdate = new Date();
          if (vitalSigns) {
            monitoring.activePersonnel[personIndex].vitalSigns = vitalSigns;
          }
        }

        await monitoring.save();

        io.to(`mine:${mineAuth.mineId}`).emit('location:updated', {
          userId: socket.userId,
          location,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error updating location:', error);
        deny(socket, 'location:update:error', 'Failed to update location');
      }
    });

    // Emergency SOS
    socket.on('emergency:sos', async (data) => {
      const { mineId, emergencyType, location, description } = data || {};

      try {
        const mineAuth = await authorizeMineEvent(socket, mineId, { errorEvent: 'emergency:error' });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        const emergency = new EmergencyResponse({
          mineId: mineAuth.mineId,
          reportedBy: socket.userId,
          emergencyType,
          severity: 'critical',
          location,
          description: description || 'SOS Emergency Alert',
          status: 'active',
        });

        await emergency.save();

        await Alert.create({
          message: `🚨 SOS EMERGENCY: ${emergencyType} at ${location?.area || 'Unknown Location'}`,
          type: 'critical',
          createdBy: mineAuth.mineId,
        });

        io.to(`mine:${mineAuth.mineId}`).emit('emergency:alert', {
          emergency,
          timestamp: new Date(),
        });

        io.emit('emergency:admin', {
          emergency,
          mineId: mineAuth.mineId,
        });

        socket.emit('emergency:confirmed', {
          emergencyId: emergency.emergencyId,
          message: 'Emergency response initiated',
        });
      } catch (error) {
        console.error('Error handling SOS:', error);
        socket.emit('emergency:error', { message: 'Failed to process emergency' });
      }
    });

    // Real-time alerts
    socket.on('alert:create', async (data) => {
      const { mineId, message, type } = data || {};

      try {
        const permAuth = authorizePermission(socket, PERMISSIONS.ALERT_CREATE, 'alert:error');
        if (!permAuth.ok) {
          deny(socket, permAuth.errorEvent, permAuth.message);
          return;
        }

        const mineAuth = await authorizeMineEvent(socket, mineId, { errorEvent: 'alert:error' });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        const alert = await Alert.create({
          message,
          type,
          createdBy: mineAuth.mineId,
        });

        io.to(`mine:${mineAuth.mineId}`).emit('alert:new', alert);
      } catch (error) {
        console.error('Error creating alert:', error);
        deny(socket, 'alert:error', 'Failed to create alert');
      }
    });

    // Alert acknowledged
    socket.on('alert:acknowledge', async (data) => {
      const { alertId, mineId } = data || {};

      try {
        const permAuth = authorizePermission(socket, PERMISSIONS.ALERT_RESOLVE, 'alert:error');
        if (!permAuth.ok) {
          deny(socket, permAuth.errorEvent, permAuth.message);
          return;
        }

        const mineAuth = await authorizeMineEvent(socket, mineId, { errorEvent: 'alert:error' });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        const alert = await Alert.findById(alertId);
        if (alert && !alert.resolved) {
          await alert.resolve(socket.userId);

          io.to(`mine:${mineAuth.mineId}`).emit('alert:resolved', {
            alertId,
            resolvedBy: socket.userId,
            resolvedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error acknowledging alert:', error);
        deny(socket, 'alert:error', 'Failed to acknowledge alert');
      }
    });

    // Equipment status update
    socket.on('equipment:status', async (data) => {
      const { mineId, equipmentId, status, metrics } = data || {};

      try {
        const managerAuth = authorizeManager(socket, 'equipment:status:error');
        if (!managerAuth.ok) {
          deny(socket, managerAuth.errorEvent, managerAuth.message);
          return;
        }

        const mineAuth = await authorizeMineEvent(socket, mineId, {
          errorEvent: 'equipment:status:error',
        });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        let monitoring = await RealTimeMonitoring.findOne({ mineId: mineAuth.mineId }).sort({
          timestamp: -1,
        });

        if (monitoring) {
          const equipmentIndex = monitoring.equipmentStatus.findIndex(
            (e) => e.equipmentId === equipmentId
          );

          if (equipmentIndex >= 0) {
            monitoring.equipmentStatus[equipmentIndex].status = status;
            monitoring.equipmentStatus[equipmentIndex].metrics = metrics;
            await monitoring.save();
          }

          io.to(`mine:${mineAuth.mineId}`).emit('equipment:updated', {
            equipmentId,
            status,
            metrics,
            timestamp: new Date(),
          });

          if (status === 'warning' || status === 'malfunction') {
            await Alert.create({
              message: `Equipment Alert: ${equipmentId} status changed to ${status}`,
              type: status === 'malfunction' ? 'critical' : 'warning',
              createdBy: mineAuth.mineId,
            });

            io.to(`mine:${mineAuth.mineId}`).emit('equipment:alert', {
              equipmentId,
              status,
            });
          }
        }
      } catch (error) {
        console.error('Error updating equipment status:', error);
        deny(socket, 'equipment:status:error', 'Failed to update equipment status');
      }
    });

    // Chat/Communication
    socket.on('chat:message', async (data) => {
      const { mineId, message, channel } = data || {};

      try {
        const mineAuth = await authorizeMineEvent(socket, mineId, { errorEvent: 'chat:error' });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        io.to(`mine:${mineAuth.mineId}`).emit('chat:new', {
          from: socket.userId,
          message,
          channel: channel || 'general',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error sending chat message:', error);
        deny(socket, 'chat:error', 'Failed to send chat message');
      }
    });

    // Environmental monitoring updates
    socket.on('environment:update', async (data) => {
      const { mineId, conditions } = data || {};

      try {
        const managerAuth = authorizeManager(socket, 'environment:update:error');
        if (!managerAuth.ok) {
          deny(socket, managerAuth.errorEvent, managerAuth.message);
          return;
        }

        const mineAuth = await authorizeMineEvent(socket, mineId, {
          errorEvent: 'environment:update:error',
        });
        if (!mineAuth.ok) {
          deny(socket, mineAuth.errorEvent, mineAuth.message);
          return;
        }

        let monitoring = await RealTimeMonitoring.findOne({ mineId: mineAuth.mineId }).sort({
          timestamp: -1,
        });

        if (monitoring) {
          monitoring.environmentalConditions = {
            ...monitoring.environmentalConditions,
            ...conditions,
          };
          await monitoring.save();

          io.to(`mine:${mineAuth.mineId}`).emit('environment:updated', {
            conditions,
            timestamp: new Date(),
          });

          if (conditions?.gasLevels) {
            const { methane, carbonMonoxide } = conditions.gasLevels;
            if (methane > 1.5 || carbonMonoxide > 50) {
              await Alert.create({
                message: `⚠️ Dangerous gas levels detected! CH4: ${methane}%, CO: ${carbonMonoxide}ppm`,
                type: 'critical',
                createdBy: mineAuth.mineId,
              });

              io.to(`mine:${mineAuth.mineId}`).emit('environment:danger', {
                gasLevels: conditions.gasLevels,
                message: 'Evacuation may be required',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error updating environment:', error);
        deny(socket, 'environment:update:error', 'Failed to update environment');
      }
    });

    // Notification system
    socket.on('notification:send', async (data) => {
      const { target, notification } = data || {};

      try {
        if (target === 'broadcast') {
          const adminAuth = authorizeAdmin(socket, 'notification:error');
          if (!adminAuth.ok) {
            deny(socket, adminAuth.errorEvent, adminAuth.message);
            return;
          }
          io.emit('notification:receive', notification);
          return;
        }

        if (typeof target === 'string' && target.startsWith('mine:')) {
          const mineId = target.slice('mine:'.length);
          const mineAuth = await authorizeMineEvent(socket, mineId, {
            errorEvent: 'notification:error',
          });
          if (!mineAuth.ok) {
            deny(socket, mineAuth.errorEvent, mineAuth.message);
            return;
          }
          io.to(`mine:${mineAuth.mineId}`).emit('notification:receive', notification);
          return;
        }

        if (typeof target === 'string' && target.startsWith('user:')) {
          const userId = target.split(':')[1];
          const isSelf = String(userId) === String(socket.userId);
          const adminAuth = authorizeAdmin(socket, 'notification:error');
          if (!isSelf && !adminAuth.ok) {
            deny(socket, 'notification:error', 'You can only send notifications to yourself');
            return;
          }
          io.to(userId).emit('notification:receive', notification);
          return;
        }

        deny(socket, 'notification:error', 'Invalid notification target');
      } catch (error) {
        console.error('Error sending notification:', error);
        deny(socket, 'notification:error', 'Failed to send notification');
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
