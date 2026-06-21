import mongoose from 'mongoose';
import Mine from '../models/Mine.js';
import CoalMine from '../models/coalMineModel.js';
import { hasPermission, PERMISSIONS, isManagerRole, isAdminRole } from '../config/roles.js';

const mineExistsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const normalizeMineId = (mineId) => {
  if (mineId == null || mineId === '') return null;
  const id = typeof mineId === 'object' && mineId?._id ? String(mineId._id) : String(mineId).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return id;
};

export const mineExists = async (mineId) => {
  const id = normalizeMineId(mineId);
  if (!id) return false;

  const cached = mineExistsCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.exists;
  }

  const [mine, coalMine] = await Promise.all([
    Mine.exists({ _id: id }),
    CoalMine.exists({ _id: id, deleted: { $ne: true } }),
  ]);
  const exists = Boolean(mine || coalMine);
  mineExistsCache.set(id, { exists, expiresAt: Date.now() + CACHE_TTL_MS });
  return exists;
};

export const initSocketAuthState = (socket) => {
  socket.allowedMines = new Set();
};

export const deny = (socket, errorEvent, message) => {
  if (errorEvent) {
    socket.emit(errorEvent, { message });
  }
};

export const authorizeMineJoin = async (socket, mineId) => {
  const id = normalizeMineId(mineId);
  if (!id) {
    return { ok: false, message: 'Invalid mine ID', errorEvent: 'join:mine:error' };
  }
  if (!(await mineExists(id))) {
    return { ok: false, message: 'Mine not found', errorEvent: 'join:mine:error' };
  }
  return { ok: true, mineId: id };
};

export const authorizeMineEvent = async (socket, mineId, { errorEvent = 'socket:error' } = {}) => {
  const id = normalizeMineId(mineId);
  if (!id) {
    return { ok: false, message: 'Invalid mine ID', errorEvent };
  }
  if (!(await mineExists(id))) {
    return { ok: false, message: 'Mine not found', errorEvent };
  }
  if (!socket.allowedMines?.has(id)) {
    return { ok: false, message: 'Join the mine room before sending mine events', errorEvent };
  }
  return { ok: true, mineId: id };
};

export const authorizePermission = (socket, permission, errorEvent = 'socket:error') => {
  if (!hasPermission(socket.userRole, permission)) {
    return { ok: false, message: 'You do not have permission for this action', errorEvent };
  }
  return { ok: true };
};

export const authorizeManager = (socket, errorEvent = 'socket:error') => {
  if (!isManagerRole(socket.userRole)) {
    return { ok: false, message: 'Manager access required', errorEvent };
  }
  return { ok: true };
};

export const authorizeAdmin = (socket, errorEvent = 'socket:error') => {
  if (!isAdminRole(socket.userRole)) {
    return { ok: false, message: 'Admin access required', errorEvent };
  }
  return { ok: true };
};

export const authorizeSelfUserId = (socket, userId, errorEvent = 'socket:error') => {
  const requested = userId != null ? String(userId) : '';
  const self = socket.userId != null ? String(socket.userId) : '';
  if (!requested || requested !== self) {
    return { ok: false, message: 'You can only update your own location', errorEvent };
  }
  return { ok: true };
};

export { PERMISSIONS };
