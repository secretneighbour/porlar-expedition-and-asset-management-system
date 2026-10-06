/**
 * POST /api/ai/weather-inventory/evaluate
 * Evaluates dynamic fuel burn rates under blizzard heating stress
 */

import { handleCors, parseJsonBody, sendSuccess, sendError } from '../../../src/server/serverlessHandler';
import { evaluateWeatherInventory } from '../../../src/server/geminiService';

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

    const result = await evaluateWeatherInventory({
      currentStockL: body.currentStockL,
      forecastScenario: body.forecastScenario,
      ambientTempC: body.ambientTempC,
      windSpeedKt: body.windSpeedKt,
      windChillC: body.windChillC,
      blizzardDays: body.blizzardDays,
      geminiApiKey: customKey,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Weather inventory evaluation failure.', 500, 'INVENTORY_ERROR');
  }
}
