/**
 * Web Standard / Next.js App Router: GET /api/health
 */

import { databaseManager } from '../../../src/server/database';
import { getSafeEnvironmentStatus, validateServerEnvironment } from '../../../src/lib/env';
import { createCorsResponse } from '../../../src/lib/cors';

export async function OPTIONS(request: Request) {
  const preflight = createCorsResponse(request, { allowedMethods: ['GET', 'OPTIONS'] });
  if (preflight) return preflight;
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const dbHealth = databaseManager.getHealthInfo();
  const envStatus = getSafeEnvironmentStatus();
  const validation = validateServerEnvironment();

  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
  const environment = process.env.NODE_ENV || 'production';

  const data = {
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
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });

  const origin = request.headers.get('origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}
