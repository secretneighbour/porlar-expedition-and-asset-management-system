/**
 * GET /api/health
 * Public health diagnostics endpoint for Polar Operations System
 * Strictly returns booleans for environment variables to ensure zero secret leakage.
 */

import { handleCors, sendJson } from '../src/server/serverlessHandler';
import { databaseManager } from '../src/server/database';
import { getSafeEnvironmentStatus, validateServerEnvironment } from '../src/lib/env';

export default function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['GET', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }));
  }

  const dbHealth = databaseManager.getHealthInfo();
  const envStatus = getSafeEnvironmentStatus();
  const validation = validateServerEnvironment();

  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
  const environment = process.env.NODE_ENV || 'production';

  sendJson(res, {
    status: 'ok',
    environment,
    vercel: isVercel,
    timestamp: new Date().toISOString(),
    database: {
      status: dbHealth.status,
      storageType: dbHealth.storageType,
      usersCount: dbHealth.usersCount,
      assetsCount: dbHealth.assetsCount,
      expeditionsCount: dbHealth.expeditionsCount,
    },
    env: envStatus,
    system: {
      geminiAiConfigured: validation.features.geminiAi,
      supabaseConfigured: validation.features.supabase,
    },
  });
}
