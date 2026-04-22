import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { isAdmin, hasPermission } from './admin-rbac';

export async function getAdminSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

export async function isCurrentUserAdmin() {
  const session = await getAdminSession();
  if (!session || !session.user) return false;
  return isAdmin(session.user.role);
}

export async function hasCurrentUserPermission(permission) {
  const session = await getAdminSession();
  if (!session || !session.user) return false;
  return hasPermission(session.user.role, permission);
}

export async function checkAdminPermission(req, requiredPermissions) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        authorized: false,
        error: 'Unauthorized: No session found',
        status: 401,
      };
    }

    if (!isAdmin(session.user.role)) {
      return {
        authorized: false,
        error: 'Forbidden: User is not an administrator',
        status: 403,
      };
    }

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

export function withAdminAuth(handler, requiredPermissions = null) {
  return async (req, res) => {
    const check = await checkAdminPermission(req, requiredPermissions);

    if (!check.authorized) {
      return res.status(check.status).json({
        error: check.error,
        success: false,
      });
    }

    req.adminUser = check.user;
    req.adminSession = check.session;

    return handler(req, res);
  };
}

export async function checkPageAccess(requiredPermissions = null) {
  try {
    const check = await checkAdminPermission({}, requiredPermissions);
    return check.authorized;
  } catch (error) {
    console.error('Page access check error:', error);
    return false;
  }
}
