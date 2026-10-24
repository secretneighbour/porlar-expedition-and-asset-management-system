/**
 * GET /api/auth/session
 * Verifies active session token and returns authenticated operator profile.
 */

import {
  handleCors,
  authenticateServerlessRequest,
  sendError,
  sendSuccess,
} from '../../src/server/serverlessHandler';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  sendSuccess(res, {
    user,
    authenticated: true,
  });
}
