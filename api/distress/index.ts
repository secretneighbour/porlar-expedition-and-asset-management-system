/**
 * POST /api/distress
 * Mayday distress signal trigger with Zero-Click Autonomous S.A.R. dispatch
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../src/server/serverlessHandler';
import { databaseManager } from '../../src/server/database';
import { executeAutonomousSAR, isAutoSarEnabled } from '../../src/server/sarService';
import { ActiveDistressAlert } from '../../src/types';

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
    const body = await parseJsonBody<ActiveDistressAlert>(req);
    const distress: ActiveDistressAlert = {
      ...body,
      timestamp: new Date().toISOString(),
      acknowledgedByHQ: false,
    };

    if (isAutoSarEnabled()) {
      const updatedWithSAR = executeAutonomousSAR(distress);
      sendSuccess(res, {
        distress: updatedWithSAR,
        autoSarDispatched: true,
      });
    } else {
      databaseManager.updateState((state) => {
        state.activeDistress = distress;
        state.conditionLevel = 'COND-1_SEVERE_BLIZZARD';
      });

      sendSuccess(res, {
        distress,
        autoSarDispatched: false,
      });
    }
  } catch (err: any) {
    sendError(res, err.message || 'Distress signal processing failed.', 500, 'DISTRESS_ERROR');
  }
}
