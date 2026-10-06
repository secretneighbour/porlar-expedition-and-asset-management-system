/**
 * GET /api/ai/sar/status
 */

import { handleCors, sendSuccess, sendError } from '../../../src/server/serverlessHandler';
import { isAutoSarEnabled } from '../../../src/server/sarService';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  sendSuccess(res, {
    autoSarDispatchEnabled: isAutoSarEnabled(),
    engine: 'POLAR AI ZERO-CLICK S.A.R. DISPATCH (ACTIVE)',
  });
}
