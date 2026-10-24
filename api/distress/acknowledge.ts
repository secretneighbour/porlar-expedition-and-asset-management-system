/**
 * POST /api/distress/acknowledge
 * Headquarters acknowledges active distress and deploys SAR asset
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
    const { acknowledgedBy = user.name, assetId, assetName } = body || {};

    const state = databaseManager.getState();
    if (!state.activeDistress) {
      return sendError(res, 'No active distress signal found to acknowledge.', 404, 'NOT_FOUND');
    }

    let updatedAlert = state.activeDistress;

    databaseManager.updateState((curr) => {
      if (!curr.activeDistress) return;
      curr.activeDistress = {
        ...curr.activeDistress,
        acknowledgedByHQ: true,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy,
        dispatchedSARAssetId: assetId || curr.activeDistress.dispatchedSARAssetId,
        dispatchedSARName: assetName || curr.activeDistress.dispatchedSARName,
      };
      updatedAlert = curr.activeDistress;

      if (assetId) {
        curr.assets = curr.assets.map((a) => (a.id === assetId ? { ...a, status: 'in_transit' } : a));
      }

      curr.dispatchLogs = [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toUTCString().replace('GMT', 'UTC').slice(17, 25) + ' UTC',
          callsign: 'HQ COMMAND',
          severity: 'urgent_distress',
          sector: curr.activeDistress.incidentType || 'DISTRESS',
          message: `Distress signal acknowledged by ${acknowledgedBy}. Dispatched rescue: ${
            assetName || 'Polar SAR Team'
          }.`,
        },
        ...curr.dispatchLogs,
      ];
    });

    sendSuccess(res, {
      distress: updatedAlert,
      message: 'Distress acknowledged and SAR assets dispatched.',
    });
  } catch (err: any) {
    sendError(res, err.message || 'Distress acknowledge failure.', 500, 'DISTRESS_ERROR');
  }
}
