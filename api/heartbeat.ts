/**
 * POST /api/heartbeat
 * Telemetry and liveness ping from mobile units and desktop consoles
 */

import { handleCors, parseJsonBody, sendSuccess, sendError } from '../src/server/serverlessHandler';
import { isAutoSarEnabled } from '../src/server/sarService';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  await parseJsonBody(req);

  sendSuccess(res, {
    status: 'received',
    serverTime: new Date().toISOString(),
    activeClients: 1,
    autoSarDispatchEnabled: isAutoSarEnabled(),
  });
}
