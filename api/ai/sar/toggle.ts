/**
 * POST /api/ai/sar/toggle
 */

import {
  handleCors,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { isAutoSarEnabled, setAutoSarEnabled } from '../../../src/server/sarService';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res, ['transport']);
  if (!user) return;

  const current = isAutoSarEnabled();
  const next = setAutoSarEnabled(!current);

  sendSuccess(res, {
    autoSarDispatchEnabled: next,
    message: `Autonomous S.A.R. dispatch ${next ? 'ENABLED (Zero-Click Mode)' : 'DISABLED (Manual HQ Only)'}`,
  });
}
