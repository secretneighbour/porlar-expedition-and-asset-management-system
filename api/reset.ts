/**
 * POST /api/reset
 * Resets system manifests to authoritative defaults while preserving users
 */

import {
  handleCors,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../src/server/serverlessHandler';
import { databaseManager } from '../src/server/database';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  const defaultState = databaseManager.resetToDefaults();

  sendSuccess(res, {
    message: 'Polar Operations state reset to baseline master manifests.',
    state: defaultState,
  });
}
