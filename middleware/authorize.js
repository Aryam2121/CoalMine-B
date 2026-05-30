import { hasPermission, isAdminRole, isManagerRole, normalizeRole } from '../config/roles.js';

/** Require user to be logged in (use after protect) */
export const requireRoles = (...roles) => (req, res, next) => {
  const userRole = normalizeRole(req.user?.role);
  const allowed = roles.map(normalizeRole);
  if (allowed.includes(userRole)) {
    return next();
  }
  return res.status(403).json({
    error: 'Access denied',
    message: `This action requires one of: ${roles.join(', ')}`,
  });
};

export const requireAdmin = (req, res, next) => {
  if (isAdminRole(req.user?.role)) return next();
  return res.status(403).json({ error: 'Access denied', message: 'Admin access required' });
};

export const requireManager = (req, res, next) => {
  if (isManagerRole(req.user?.role)) return next();
  return res.status(403).json({ error: 'Access denied', message: 'Manager access required' });
};

export const requirePermission = (permission) => (req, res, next) => {
  if (hasPermission(req.user?.role, permission)) return next();
  return res.status(403).json({
    error: 'Access denied',
    message: 'You do not have permission for this action',
  });
};

export default { requireRoles, requireAdmin, requireManager, requirePermission };
