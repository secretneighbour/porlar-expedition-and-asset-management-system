/**
 * POST /api/distress/resolve
 * Clears active distress and resets sector threat level
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../src/server/serverlessHandler';
import { databaseManager } from '../../src/server/database';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res, ['transport']);
  if (!user) return;

  try {
    const body = await parseJsonBody(req);
    const { resolutionNotes } = body || {};

    const state = databaseManager.getState();
    const oldDistress = state.activeDistress;

    databaseManager.updateState((curr) => {
      curr.activeDistress = null;
      curr.conditionLevel = 'COND-2_CAUTION';

      curr.dispatchLogs = [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
          callsign: 'HQ COMMAND',
          severity: 'routine',
          sector: oldDistress?.incidentType || 'DISTRESS',
          message: `Distress situation resolved by ${user.name}. ${resolutionNotes || 'All personnel accounted for.'}`,
        },
        ...curr.dispatchLogs,
      ];
    });

    sendSuccess(res, {
      message: 'Distress resolved successfully. Sector condition set to COND-2_CAUTION.',
      conditionLevel: 'COND-2_CAUTION',
    });
  } catch (err: any) {
    sendError(res, err.message || 'Distress resolution failure.', 500, 'DISTRESS_ERROR');
  }
}
