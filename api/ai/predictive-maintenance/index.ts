/**
 * POST /api/ai/predictive-maintenance
 * Generates proactive pre-failure forecasts using Gemini 3.8 Flash
 */

import { handleCors, parseJsonBody, sendSuccess, sendError } from '../../../src/server/serverlessHandler';
import { evaluatePredictiveMaintenance } from '../../../src/server/geminiService';

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

    const result = await evaluatePredictiveMaintenance({
      assetId: body.assetId,
      assetName: body.assetName,
      ambientTempC: body.ambientTempC,
      operatingHours: body.operatingHours,
      vibrationRms: body.vibrationRms,
      weatherCondition: body.weatherCondition,
      geminiApiKey: customKey,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Predictive maintenance evaluation failure.', 500, 'AI_PREDICTIVE_ERROR');
  }
}
