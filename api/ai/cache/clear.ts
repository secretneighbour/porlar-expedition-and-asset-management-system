/**
 * POST /api/ai/cache/clear
 */

import {
  handleCors,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { aiOptimizer } from '../../../src/server/aiOptimizer';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  const result = aiOptimizer.clear();
  sendSuccess(res, {
    message: 'AI request cache and in-flight promises cleared successfully.',
    clearedEntries: result.clearedEntries,
  });
}
