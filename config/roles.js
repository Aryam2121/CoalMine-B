/**
 * Central role configuration — keep in sync with CoalMine-F/src/utils/roles.js
 */

export const ROLES = {
  WORKER: 'worker',
  INSPECTOR: 'Inspector',
  SAFETY_MANAGER: 'Safety Manager',
  SHIFT_INCHARGE: 'Shift Incharge',
  MINE_ADMIN: 'Mine admin',
  SUPER_ADMIN: 'Super admin',
};

export const ALL_ROLES = Object.values(ROLES);

/** Roles users may pick at self-registration (not admin tiers) */
export const SIGNUP_ROLES = [
  ROLES.WORKER,
  ROLES.INSPECTOR,
  ROLES.SAFETY_MANAGER,
  ROLES.SHIFT_INCHARGE,
];

export const normalizeRole = (role) => (role || ROLES.WORKER).toLowerCase().trim();

const ADMIN_SET = new Set([
  normalizeRole(ROLES.SUPER_ADMIN),
  normalizeRole(ROLES.MINE_ADMIN),
  'admin',
]);

const MANAGER_SET = new Set([
  ...ADMIN_SET,
  normalizeRole(ROLES.SAFETY_MANAGER),
  normalizeRole(ROLES.SHIFT_INCHARGE),
  normalizeRole(ROLES.INSPECTOR),
]);

export const isAdminRole = (role) => ADMIN_SET.has(normalizeRole(role));
export const isManagerRole = (role) => MANAGER_SET.has(normalizeRole(role));

export const canSignupAs = (role) =>
  SIGNUP_ROLES.map(normalizeRole).includes(normalizeRole(role));

/** Permission keys used by authorize() middleware */
export const PERMISSIONS = {
  USER_MANAGE: 'user:manage',
  AUDIT_READ: 'audit:read',
  ATTENDANCE_MANAGE_ALL: 'attendance:manage_all',
  SAFETY_REPORT_APPROVE: 'safety_report:approve',
  SAFETY_PLAN_CREATE: 'safety_plan:create',
  SAFETY_PLAN_DELETE: 'safety_plan:delete',
  ALERT_CREATE: 'alert:create',
  ALERT_RESOLVE: 'alert:resolve',
  ALERT_RESOLVE_ALL: 'alert:resolve_all',
  COMPLIANCE_WRITE: 'compliance:write',
  COAL_MINE_WRITE: 'coal_mine:write',
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_EXPORT: 'reports:export',
  EMERGENCY_MANAGE: 'emergency:manage',
};

const PERMISSION_MAP = {
  [PERMISSIONS.USER_MANAGE]: (r) => isAdminRole(r),
  [PERMISSIONS.AUDIT_READ]: (r) => isAdminRole(r),
  [PERMISSIONS.ATTENDANCE_MANAGE_ALL]: (r) => isManagerRole(r),
  [PERMISSIONS.SAFETY_REPORT_APPROVE]: (r) => isManagerRole(r),
  [PERMISSIONS.SAFETY_PLAN_CREATE]: (r) => isManagerRole(r),
  [PERMISSIONS.SAFETY_PLAN_DELETE]: (r) => isManagerRole(r),
  [PERMISSIONS.ALERT_CREATE]: (r) =>
    isManagerRole(r) || normalizeRole(r) === normalizeRole(ROLES.WORKER),
  [PERMISSIONS.ALERT_RESOLVE]: (r) => isManagerRole(r),
  [PERMISSIONS.ALERT_RESOLVE_ALL]: (r) => isManagerRole(r),
  [PERMISSIONS.COMPLIANCE_WRITE]: (r) => isManagerRole(r),
  [PERMISSIONS.COAL_MINE_WRITE]: (r) => isAdminRole(r) || normalizeRole(r) === normalizeRole(ROLES.SHIFT_INCHARGE),
  [PERMISSIONS.ANALYTICS_VIEW]: (r) => isManagerRole(r),
  [PERMISSIONS.REPORTS_EXPORT]: (r) => isManagerRole(r),
  [PERMISSIONS.EMERGENCY_MANAGE]: (r) => isManagerRole(r),
};

export const hasPermission = (role, permission) => {
  const fn = PERMISSION_MAP[permission];
  return fn ? fn(role) : false;
};

export default {
  ROLES,
  ALL_ROLES,
  SIGNUP_ROLES,
  normalizeRole,
  isAdminRole,
  isManagerRole,
  canSignupAs,
  hasPermission,
  PERMISSIONS,
};
