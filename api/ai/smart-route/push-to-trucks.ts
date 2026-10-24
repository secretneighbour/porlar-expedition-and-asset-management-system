/**
 * POST /api/ai/smart-route/push-to-trucks
 * Uploads safe route packet to convoy vehicle navigation units
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { pushSmartRouteToTrucks } from '../../../src/server/geminiService';

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
    const result = pushSmartRouteToTrucks({
      routeId: body.routeId,
      routeTitle: body.routeTitle,
      trucks: body.trucks,
      safeDistanceKm: body.safeDistanceKm,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Route convoy push failure.', 500, 'PUSH_ERROR');
  }
}
