/**
 * Admin Authentication and Authorization Middleware
 * Protects admin routes and enforces role-based access control
 */

import { getServerSession } from 'next-auth';
import { isAdmin, hasPermission } from './admin-rbac';

/**
 * Get current admin user session
 * @returns {Promise<Object|null>} - User session or null
 */
export async function getAdminSession() {
  try {
    const session = await getServerSession();
    return session;
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Check if current user is an admin
 * @returns {Promise<boolean>}
 */
export async function isCurrentUserAdmin() {
  const session = await getAdminSession();
  if (!session || !session.user) return false;
  return isAdmin(session.user.role);
}

/**
 * Check if current user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>}
 */
export async function hasCurrentUserPermission(permission) {
  const session = await getAdminSession();
  if (!session || !session.user) return false;
  return hasPermission(session.user.role, permission);
}

/**
 * Middleware function for protecting API routes
 * @param {Object} req - Next.js request object
 * @param {string|string[]} requiredPermissions - Single or array of permissions
 * @returns {Promise<Object>} - Object with result and optionally error/session
 */
export async function checkAdminPermission(req, requiredPermissions) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return {
        authorized: false,
        error: 'Unauthorized: No session found',
        status: 401,
      };
    }

    // Check if user is admin
    if (!isAdmin(session.user.role)) {
      return {
        authorized: false,
        error: 'Forbidden: User is not an administrator',
        status: 403,
      };
    }

    // Check specific permissions if provided
    if (requiredPermissions) {
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const hasRequired = permissions.every(perm =>
        hasPermission(session.user.role, perm)
      );

      if (!hasRequired) {
        return {
          authorized: false,
          error: 'Forbidden: Insufficient permissions',
          status: 403,
        };
      }
    }

    return {
      authorized: true,
      session,
      user: session.user,
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

/**
 * Wrapper for API route handlers
 * @param {Function} handler - API handler function
 * @param {string|string[]} requiredPermissions - Required permissions
 * @returns {Function} - Wrapped handler
 */
export function withAdminAuth(handler, requiredPermissions = null) {
  return async (req, res) => {
    const check = await checkAdminPermission(req, requiredPermissions);

    if (!check.authorized) {
      return res.status(check.status).json({
        error: check.error,
        success: false,
      });
    }

    // Attach user to request for handler use
    req.adminUser = check.user;
    req.adminSession = check.session;

    return handler(req, res);
  };
}

/**
 * Middleware function for protecting pages
 * @param {string|string[]} requiredPermissions - Required permissions
 * @returns {Promise<boolean>}
 */
export async function checkPageAccess(requiredPermissions = null) {
  try {
    const check = await checkAdminPermission({}, requiredPermissions);
    return check.authorized;
  } catch (error) {
    console.error('Page access check error:', error);
    return false;
  }
}
