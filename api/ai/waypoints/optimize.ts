/**
 * POST /api/ai/waypoints/optimize
 * Waypoint Studio hybrid optimizer using Gemini 3.8 Flash & deterministic polar geodesic solver
 */

import { handleCors, parseJsonBody, sendJson, sendError } from '../../../src/server/serverlessHandler';
import { optimizeWaypoints } from '../../../src/server/geminiService';
import { databaseManager } from '../../../src/server/database';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    const body = await parseJsonBody(req);
    const customKey = body.geminiApiKey || req.headers['x-gemini-api-key'];

    const result = await optimizeWaypoints(body, customKey);

    // Audit log
    databaseManager.updateState((state) => {
      if (state.polarisDb && result.plan) {
        state.polarisDb.auditLog.unshift({
          id: `AUD-WP-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          actor: body.isSimulation ? 'SIMULATION-GEMINI-NAV' : 'GEMINI-WAYPOINT-AI',
          action: 'AI_WAYPOINT_ROUTE_OPTIMIZED',
          details: `Optimized traverse order across ${body.waypoints?.length || 0} candidate waypoints. Mode: ${
            result.mode
          }.`,
          severity: 'normal',
        });
      }
    });

    sendJson(res, {
      ok: true,
      success: true,
      ...result,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Waypoint optimization failure.', 400, 'OPTIMIZATION_ERROR');
  }
}
