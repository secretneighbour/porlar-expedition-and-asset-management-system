/**
 * POST /api/ai/test-key
 * Validates Gemini API Key against gemini-3.8-flash model
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../src/server/serverlessHandler';
import { testGeminiKey } from '../../src/server/geminiService';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  try {
    const body = await parseJsonBody(req);
    const keyToTest = (body.apiKey || body.geminiApiKey || req.headers['x-gemini-api-key'] || '').trim();

    if (!keyToTest) {
      return sendError(res, 'Gemini API key string is required for verification.', 400, 'MISSING_KEY');
    }

    const result = await testGeminiKey(keyToTest);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Gemini API authentication failed.', 401, 'GEMINI_AUTH_FAILED');
  }
}
