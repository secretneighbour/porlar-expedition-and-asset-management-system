/**
 * POST /api/ai/route-optimizer/astar
 * Tactical Polar A* Search with slope, danger-zone, and wind vector calculations
 */

import { handleCors, parseJsonBody, sendJson, sendError } from '../../../src/server/serverlessHandler';
import { optimizeAStarRoute } from '../../../src/server/geminiService';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    const body = await parseJsonBody(req);
    const { startNode, goalNode, waypoints, dangerZones, environment, asset } = body || {};

    if (!startNode || !goalNode) {
      return sendError(res, 'startNode and goalNode coordinates are required.', 400, 'VALIDATION_ERROR');
    }

    const result = optimizeAStarRoute({
      startNode,
      goalNode,
      waypoints,
      dangerZones,
      environment,
      asset,
    });

    sendJson(res, {
      ok: true,
      success: true,
      ...result,
    });
  } catch (err: any) {
    sendError(res, err.message || 'A* pathfinding calculation error.', 500, 'ASTAR_ERROR');
  }
}
