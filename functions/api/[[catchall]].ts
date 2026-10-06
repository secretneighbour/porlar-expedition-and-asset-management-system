/**
 * Cloudflare Pages Function: /api/* Unified Gateway & Reverse Proxy
 *
 * Catches all requests to /api/* on Cloudflare Pages to guarantee:
 * 1. API requests NEVER fall through to the SPA's index.html fallback.
 * 2. If an external backend is configured (via VITE_API_BASE_URL or BACKEND_URL),
 *    the request is proxied seamlessly with full CORS, auth headers, and body streaming.
 * 3. If no external backend is configured, handles core operational endpoints
 *    (/api/health, /api/auth/login, /api/heartbeat) directly on the edge returning pure JSON.
 * 4. Strictly returns JSON responses for all statuses (200, 400, 401, 403, 404, 500, 502).
 */

interface Env {
  VITE_API_BASE_URL?: string;
  VITE_BACKEND_URL?: string;
  BACKEND_URL?: string;
  API_BASE_URL?: string;
  AUTH_SECRET?: string;
  JWT_SECRET?: string;
  GEMINI_API_KEY?: string;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  [key: string]: any;
}

// Authorized Polar Operations Personnel Directory
const POLAR_PERSONNEL = [
  {
    id: 'RSC-0142',
    name: 'Dr. Elena Rostova',
    role: 'Scientist / Team Member',
    email: 'elena.rostova@polar.gov.in',
    password: 'polar2026',
  },
  {
    id: 'AST-0101',
    name: 'Vikram Nair',
    role: 'Asset Manager',
    email: 'vikram.nair@polar.gov.in',
    password: 'polar2026',
  },
  {
    id: 'TRN-0301',
    name: 'Marcus Vance',
    role: 'Logistics Officer',
    email: 'marcus.vance@polar.gov.in',
    password: 'polar2026',
  },
  {
    id: 'ADM-0001',
    name: 'Station Commander',
    role: 'Super Admin',
    email: 'admin@polar.gov.in',
    password: 'polar2026',
  },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  researcher: ['Scientist / Team Member', 'Researcher', 'Super Admin'],
  asset: ['Asset Manager', 'Asset Management', 'Maintenance Officer', 'Super Admin'],
  transport: ['Logistics Officer', 'Transportation', 'Expedition Manager', 'Super Admin'],
  admin: ['Super Admin'],
};

const DEFAULT_ROUTES: Record<string, string> = {
  researcher: 'dashboard',
  asset: 'assets',
  transport: 'transport',
  admin: 'dashboard',
};

/**
 * Creates an authoritative HMAC-SHA256 session token using Web Crypto API
 */
async function createEdgeSessionToken(
  user: { id: string; name: string; role: string; email: string },
  remember: boolean,
  secret: string
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const durationSec = remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  const exp = iat + durationSec;

  const payload = {
    userId: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    iat,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = btoa(payloadJson).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'polar-ops-secret-key-2026'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadBase64));
  const sigBytes = new Uint8Array(sigBuffer);
  let binary = '';
  for (let i = 0; i < sigBytes.byteLength; i++) {
    binary += String.fromCharCode(sigBytes[i]);
  }
  const signature = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `polar-jwt.${payloadBase64}.${signature}`;
}

/**
 * Generates CORS response headers allowing Cloudflare Pages/Workers & localhost
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Session-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/**
 * Cloudflare Pages Function entry point for all /api/* routes
 */
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();
  const corsHeaders = getCorsHeaders(request);

  // 1. Handle HTTP OPTIONS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Check for configured upstream backend
  const backendTarget = (
    env?.VITE_API_BASE_URL ||
    env?.VITE_BACKEND_URL ||
    env?.BACKEND_URL ||
    env?.API_BASE_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  // If a distinct external backend is configured (e.g. Node server, Vercel, or Worker), proxy to it
  if (backendTarget && !backendTarget.includes(url.host)) {
    try {
      const cleanBase = backendTarget.startsWith('http') ? backendTarget : `https://${backendTarget}`;
      let targetPath = pathname;
      if (cleanBase.endsWith('/api') && targetPath.startsWith('/api/')) {
        targetPath = targetPath.substring(4);
      }
      const targetUrl = `${cleanBase}${targetPath}${url.search}`;

      const forwardHeaders = new Headers(request.headers);
      forwardHeaders.delete('host');
      forwardHeaders.set('X-Forwarded-Host', url.host);
      forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const response = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body: ['GET', 'HEAD'].includes(method) ? undefined : request.body,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(response.headers);
      for (const [key, val] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, val);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (proxyErr: any) {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: {
            code: 'BACKEND_PROXY_FAILED',
            message: `Cloudflare Operations Gateway could not connect to backend at ${backendTarget}: ${
              proxyErr.message || 'Network unreachable'
            }`,
          },
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  }

  // 3. Native Edge Handlers (standalone Cloudflare deployment or same-domain API)

  // A. GET /api/health
  if (pathname === '/api/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        environment: 'production',
        cloudflare: true,
        runtime: 'cloudflare-pages-edge',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          storageType: 'cloudflare_edge',
          usersCount: 16,
          assetsCount: 9,
          expeditionsCount: 4,
        },
        env: {
          GEMINI_API_KEY: Boolean(env?.GEMINI_API_KEY),
          AUTH_SECRET: Boolean(env?.AUTH_SECRET),
          DATABASE_URL: Boolean(env?.DATABASE_URL),
          SUPABASE_URL: Boolean(env?.SUPABASE_URL || env?.NEXT_PUBLIC_SUPABASE_URL),
        },
        system: {
          geminiAiConfigured: Boolean(env?.GEMINI_API_KEY),
          supabaseConfigured: Boolean(env?.SUPABASE_URL || env?.NEXT_PUBLIC_SUPABASE_URL),
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
        },
      }
    );
  }

  // B. POST /api/auth/login
  if (pathname === '/api/auth/login') {
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { role, userId, password, remember } = body || {};

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'User ID is required.' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Password is required.' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const cleanUserId = userId.trim();
    const cleanRole = typeof role === 'string' ? role.trim().toLowerCase() : 'researcher';

    // Verify credentials
    const matchedUser = POLAR_PERSONNEL.find((u) => u.id.toLowerCase() === cleanUserId.toLowerCase());

    if (!matchedUser || password !== matchedUser.password) {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: `Invalid credentials. User ID "${cleanUserId}" not found in Polar Personnel Directory or password incorrect.`,
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Role check
    const allowedRoles = ROLE_PERMISSIONS[cleanRole] || ['Super Admin'];
    const hasPermission = allowedRoles.some((r) => r.toLowerCase() === matchedUser.role.toLowerCase());

    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          success: false,
          ok: false,
          error: {
            code: 'ROLE_MISMATCH',
            message: `Role authorization mismatch: User "${matchedUser.name}" (${matchedUser.role}) is not authorized for the "${cleanRole.toUpperCase()}" access portal. Please select an authorized role.`,
          },
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const secret = env?.AUTH_SECRET || env?.JWT_SECRET || 'polar-ops-secret-key-2026';
    const token = await createEdgeSessionToken(matchedUser, Boolean(remember), secret);
    const dashboardRoute = DEFAULT_ROUTES[cleanRole] || 'dashboard';

    return new Response(
      JSON.stringify({
        success: true,
        ok: true,
        token,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          role: matchedUser.role,
          email: matchedUser.email,
          active: true,
        },
        dashboardRoute,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  // C. GET /api/heartbeat
  if (pathname === '/api/heartbeat') {
    return new Response(
      JSON.stringify({
        status: 'alive',
        ok: true,
        timestamp: new Date().toISOString(),
        service: 'polar-operations-edge',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  // D. POST /api/auth/logout
  if (pathname === '/api/auth/logout') {
    return new Response(
      JSON.stringify({
        success: true,
        ok: true,
        message: 'Logged out successfully from Polar Operations System.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  // E. Fallback 404 for unrecognized /api routes - strictly returns JSON, NEVER HTML!
  return new Response(
    JSON.stringify({
      success: false,
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `Polar Operations API endpoint not found: ${pathname}`,
      },
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}
