/**
 * POST /api/ai/recon-eval
 * Evaluates polar reconnaissance logs and hazards using Gemini 3.8 Flash
 */

import { handleCors, parseJsonBody, sendSuccess, sendError } from '../../src/server/serverlessHandler';
import { evaluateRecon } from '../../src/server/geminiService';

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

    const result = await evaluateRecon({
      prompt: body.prompt,
      region: body.region,
      focusAsset: body.focusAsset,
      focusExpedition: body.focusExpedition,
      geminiApiKey: customKey,
    });

    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Recon evaluation failure.', 500, 'AI_RECON_ERROR');
  }
}
