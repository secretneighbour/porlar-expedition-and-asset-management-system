/**
 * POST /api/ai/weather-inventory/request-ship
 * Dispatches early fuel replenishment tanker request
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { requestWeatherInventoryShipment } from '../../../src/server/geminiService';

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
    const result = requestWeatherInventoryShipment({
      fuelLitersRequested: body.fuelLitersRequested,
      vesselName: body.vesselName,
      notes: body.notes,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Tanker dispatch request failure.', 500, 'DISPATCH_ERROR');
  }
}
