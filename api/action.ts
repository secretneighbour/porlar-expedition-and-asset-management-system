/**
 * POST /api/action
 * Dispatches operational client actions to database state
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../src/server/serverlessHandler';
import { handleClientAction } from '../src/server/actionHandler';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  try {
    const body = await parseJsonBody(req);
    const { action, payload } = body || {};

    if (!action) {
      return sendError(res, 'Action type is required.', 400, 'VALIDATION_ERROR');
    }

    const updatedState = handleClientAction(action, payload);

    sendSuccess(res, {
      action,
      updated: true,
      state: updatedState,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Action dispatch failure.', 500, 'ACTION_ERROR');
  }
}
