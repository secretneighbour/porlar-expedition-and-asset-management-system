/**
 * POST /api/ai/smart-route/optimize
 * Optimizes safe blue-ice convoy route using satellite SAR crevasse mapping and Gemini
 */

import { handleCors, parseJsonBody, sendSuccess, sendError } from '../../../src/server/serverlessHandler';
import { optimizeSmartRoute } from '../../../src/server/geminiService';

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

    const result = await optimizeSmartRoute({
      corridor: body.corridor,
      sensorSource: body.sensorSource,
      trucks: body.trucks,
      userLat: body.userLat,
      userLng: body.userLng,
      userLocationName: body.userLocationName,
      destinationName: body.destinationName,
      weatherSummary: body.weatherSummary,
      localHazards: body.localHazards,
      geminiApiKey: customKey,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Smart route optimization failure.', 500, 'ROUTE_ERROR');
  }
}
