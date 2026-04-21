/**
 * Admin Role-Based Access Control (RBAC) System
 * Provides role-based authorization for admin panel operations
 */

// Define admin roles and their permissions
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  ANALYTICS_VIEWER: 'analytics_viewer',
};

// Permission mapping for each role
export const ROLE_PERMISSIONS = {
  super_admin: {
    // User Management
    'user:view_all': true,
    'user:view_details': true,
    'user:edit': true,
    'user:delete': true,
    'user:suspend': true,
    'user:verify': true,
    'user:ban': true,
    'user:change_role': true,

    // Content Management
    'content:view': true,
    'content:create': true,
    'content:edit': true,
    'content:delete': true,
    'content:publish': true,

    // Contest Management
    'contest:view': true,
    'contest:create': true,
    'contest:edit': true,
    'contest:delete': true,
    'contest:manage_problems': true,
    'contest:view_analytics': true,

    // Moderation
    'moderation:view_reports': true,
    'moderation:handle_reports': true,
    'moderation:remove_content': true,
    'moderation:manage_warnings': true,
    'moderation:ban_users': true,

    // Job Management
    'job:view': true,
    'job:create': true,
    'job:edit': true,
    'job:delete': true,
    'job:verify': true,

    // Analytics
    'analytics:view_all': true,
    'analytics:export_data': true,

    // System Management
    'system:view_logs': true,
    'system:manage_settings': true,
    'system:manage_api_keys': true,
    'system:manage_features': true,
    'system:view_health': true,
  },

  admin: {
    'user:view_all': true,
    'user:view_details': true,
    'user:edit': true,
    'user:suspend': true,
    'user:verify': true,

    'content:view': true,
    'content:create': true,
    'content:edit': true,
    'content:delete': true,

    'contest:view': true,
    'contest:create': true,
    'contest:edit': true,
    'contest:manage_problems': true,
    'contest:view_analytics': true,

    'moderation:view_reports': true,
    'moderation:handle_reports': true,
    'moderation:remove_content': true,

    'job:view': true,
    'job:create': true,
    'job:edit': true,
    'job:verify': true,

    'analytics:view_all': true,

    'system:view_logs': true,
    'system:view_health': true,
  },

  moderator: {
    'user:view_all': true,
    'user:view_details': true,
    'user:suspend': true,

    'content:view': true,
    'content:edit': true,

    'moderation:view_reports': true,
    'moderation:handle_reports': true,
    'moderation:remove_content': true,
    'moderation:manage_warnings': true,

    'analytics:view_all': false,

    'system:view_health': true,
  },

  analytics_viewer: {
    'user:view_all': true,
    'user:view_details': true,

    'content:view': true,

    'contest:view': true,
    'contest:view_analytics': true,

    'job:view': true,

    'analytics:view_all': true,

    'system:view_health': true,
  },
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - User's admin role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || {};
  return permissions[permission] === true;
}

/**
 * Check if a user has all required permissions
 * @param {string} userRole - User's admin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has all permissions
 */
export function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has any of the required permissions
 * @param {string} userRole - User's admin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has any permission
 */
export function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 * @param {string} userRole - User's admin role
 * @returns {Object} - Object with all permissions
 */
export function getPermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || {};
}

/**
 * Check if user is admin (includes all admin levels)
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isAdmin(userRole) {
  return Object.values(ADMIN_ROLES).includes(userRole);
}

/**
 * Check if user is super admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export function isSuperAdmin(userRole) {
  return userRole === ADMIN_ROLES.SUPER_ADMIN;
}

/**
 * Get role hierarchy level (higher = more permissions)
 * @param {string} userRole - User's role
 * @returns {number}
 */
export function getRoleHierarchy(userRole) {
  const hierarchy = {
    super_admin: 4,
    admin: 3,
    moderator: 2,
    analytics_viewer: 1,
    user: 0,
  };
  return hierarchy[userRole] || 0;
}

/**
 * Check if one role can manage another role
 * @param {string} managerRole - The role trying to manage
 * @param {string} targetRole - The role being managed
 * @returns {boolean}
 */
export function canManageRole(managerRole, targetRole) {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
}
