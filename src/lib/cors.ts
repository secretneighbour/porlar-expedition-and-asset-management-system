/**
 * Reusable Server-Side CORS & Security Gateway Utility
 * Compatible with Node.js Serverless Functions, Express, and Next.js Route Handlers.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { getServerEnv } from './env';

const LOCAL_LAN_REGEX =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i;

const VERCEL_DOMAIN_REGEX = /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/i;
const TAURI_ORIGIN_REGEX = /^(tauri:\/\/localhost|https?:\/\/tauri\.localhost)$/i;

export interface CorsOptions {
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
}

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const DEFAULT_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-Polar-Client',
  'X-Gemini-Api-Key',
  'Accept',
  'ngrok-skip-browser-warning',
];

/**
 * Validates whether an incoming origin is trusted.
 */
export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return true; // Same-origin or non-browser client (curl, Tauri native)
  const clean = origin.trim();

  // 1. Check local & LAN loopback
  if (LOCAL_LAN_REGEX.test(clean)) return true;

  // 2. Check Vercel production and preview domains
  if (VERCEL_DOMAIN_REGEX.test(clean)) return true;

  // 3. Check native desktop/mobile Tauri origins
  if (TAURI_ORIGIN_REGEX.test(clean)) return true;

  // 4. Check explicit configured origins in environment
  try {
    const env = getServerEnv();
    if (env.CORS_ALLOWED_ORIGINS.length > 0) {
      if (env.CORS_ALLOWED_ORIGINS.some((allowed) => allowed === '*' || allowed.toLowerCase() === clean.toLowerCase())) {
        return true;
      }
    }
  } catch {
    // If getServerEnv fails in unusual contexts, fall back to safe heuristics
  }

  return false;
}

/**
 * Applies standard CORS headers to a Node.js / Vercel ServerResponse.
 * Returns `true` if the request was an OPTIONS preflight that has been resolved (status 204),
 * or `false` if execution should proceed to the main handler.
 */
export function handleCors(
  req: IncomingMessage | any,
  res: ServerResponse | any,
  options: CorsOptions = {}
): boolean {
  const origin = req.headers?.origin || req.headers?.Origin;
  const methods = (options.allowedMethods || DEFAULT_METHODS).join(', ');
  const headers = (options.allowedHeaders || DEFAULT_HEADERS).join(', ');
  const allowCredentials = options.allowCredentials !== false;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    if (allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else if (!origin) {
    // Non-browser request or same origin
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  res.setHeader('Access-Control-Max-Age', '86400'); // 24-hour preflight cache

  // Intercept OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

/**
 * Next.js App Router (Web Fetch API) CORS preflight helper
 */
export function createCorsResponse(request: Request, options: CorsOptions = {}): Response | null {
  const origin = request.headers.get('origin');
  const methods = (options.allowedMethods || DEFAULT_METHODS).join(', ');
  const headers = (options.allowedHeaders || DEFAULT_HEADERS).join(', ');

  const responseHeaders = new Headers({
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': headers,
    'Access-Control-Max-Age': '86400',
  });

  if (origin && isAllowedOrigin(origin)) {
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    responseHeaders.set('Access-Control-Allow-Origin', '*');
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  return null;
}
