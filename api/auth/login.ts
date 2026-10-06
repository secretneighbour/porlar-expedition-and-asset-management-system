/**
 * POST /api/auth/login
 * Authoritative Polar Operator Authentication Endpoint
 */

import { handleCors, parseJsonBody, sendError, sendSuccess } from '../../src/server/serverlessHandler';
import { databaseManager } from '../../src/server/database';
import { createSessionToken } from '../../src/server/auth';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    const body = await parseJsonBody(req);
    const { role, userId, password, remember } = body || {};

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return sendError(res, 'User ID is required.', 400, 'VALIDATION_ERROR');
    }
    if (!password || typeof password !== 'string') {
      return sendError(res, 'Password is required.', 400, 'VALIDATION_ERROR');
    }

    const cleanUserId = userId.trim();
    const cleanRole = typeof role === 'string' ? role.trim().toLowerCase() : 'researcher';

    const verifyResult = databaseManager.verifyCredentials(cleanUserId, password);
    if (!verifyResult.ok || !verifyResult.user) {
      return sendError(
        res,
        verifyResult.error || `Invalid credentials. User ID "${cleanUserId}" not found in Polar Personnel Directory.`,
        401,
        'INVALID_CREDENTIALS'
      );
    }

    const user = verifyResult.user;

    // Role verification
    const roleAuthorizationMap: Record<string, string[]> = {
      researcher: ['Scientist / Team Member', 'Researcher', 'Super Admin'],
      asset: ['Asset Manager', 'Asset Management', 'Maintenance Officer', 'Super Admin'],
      transport: ['Logistics Officer', 'Transportation', 'Expedition Manager', 'Super Admin'],
      admin: ['Super Admin'],
    };

    const defaultRoutes: Record<string, string> = {
      researcher: 'dashboard',
      asset: 'assets',
      transport: 'transport',
      admin: 'dashboard',
    };

    const allowedUserRoles = roleAuthorizationMap[cleanRole] || ['Super Admin'];
    const hasPermission = allowedUserRoles.some(
      (r) => r.toLowerCase() === (user.role || '').toLowerCase()
    );

    if (!hasPermission) {
      return sendError(
        res,
        `Role authorization mismatch: User "${user.name}" (${user.role}) is not authorized for the "${cleanRole.toUpperCase()}" access portal. Please select an authorized role.`,
        403,
        'ROLE_MISMATCH'
      );
    }

    const token = createSessionToken(user, Boolean(remember));
    const dashboardRoute = defaultRoutes[cleanRole] || 'dashboard';

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        active: true,
      },
      dashboardRoute,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Authentication processing error.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
