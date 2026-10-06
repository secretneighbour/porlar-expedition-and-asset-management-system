/**
 * POST /api/ai/predictive-maintenance/execute
 * Dispatches mechanic work order and updates asset status
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { executePredictiveMaintenance } from '../../../src/server/geminiService';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res, ['asset']);
  if (!user) return;

  try {
    const body = await parseJsonBody(req);
    const result = executePredictiveMaintenance({
      assetId: body.assetId,
      technician: body.technician || user.name,
      partConsumed: body.partConsumed,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Work order execution failure.', 500, 'EXECUTION_ERROR');
  }
}
