/**
 * GET /api/state
 * Retrieves authoritative operations state for Command Center and Polar Console
 */

import { handleCors, sendJson, sendError } from '../src/server/serverlessHandler';
import { databaseManager } from '../src/server/database';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const systemState = databaseManager.getState();

  // Return both structured state and top-level fields for universal frontend compatibility
  sendJson(res, {
    ok: true,
    success: true,
    state: systemState,
    connectedClients: 1,
    devices: [
      {
        id: 'term-hub-active',
        type: 'laptop_hq',
        name: 'Operations HQ Command',
        lastSeen: Date.now(),
      },
    ],
    serverTime: new Date().toISOString(),
    ...systemState,
  });
}
