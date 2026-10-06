/**
 * GET /api/auth/diagnostics
 * Returns directory overview and serverless health indicators without exposing passwords.
 */

import { handleCors, sendSuccess, sendError } from '../../src/server/serverlessHandler';
import { databaseManager } from '../../src/server/database';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const state = databaseManager.getState();
  const users = state.polarisDb?.users || [];

  const sanitizedUsers = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    active: u.active !== false,
  }));

  sendSuccess(res, {
    databaseStatus: 'connected',
    registeredAccountsCount: sanitizedUsers.length,
    users: sanitizedUsers,
    timestamp: new Date().toISOString(),
  });
}
