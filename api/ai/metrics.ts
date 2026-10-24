/**
 * GET /api/ai/metrics
 * Returns AI token savings and request coalescing performance statistics
 */

import { handleCors, sendSuccess, sendError } from '../../src/server/serverlessHandler';
import { aiOptimizer } from '../../src/server/aiOptimizer';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  sendSuccess(res, {
    metrics: aiOptimizer.getMetrics(),
    timestamp: new Date().toISOString(),
  });
}
