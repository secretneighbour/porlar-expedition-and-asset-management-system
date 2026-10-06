/**
 * POST /api/auth/logout
 */

import { handleCors, sendSuccess, sendError } from '../../src/server/serverlessHandler';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  sendSuccess(res, { message: 'Logged out successfully' });
}
