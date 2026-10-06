/**
 * Polar Operations Environment Configuration & Validation Utility
 *
 * Provides strict segregation between client-safe variables and server-only secrets.
 * Validates configuration without exposing secret tokens in error messages or logs.
 */

// ============================================================================
// CLIENT ENVIRONMENT (Safe to execute in browser / mobile)
// ============================================================================

export interface ClientEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  WS_URL: string;
  API_BASE_URL: string;
  IS_PRODUCTION: boolean;
}

function readClientVar(keys: string[]): string {
  // Check process.env (Node / SSR / Next.js)
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const val = process.env[key];
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
  }

  // Check Vite client bundler environment
  try {
    const meta: any = (0, eval)('typeof import.meta !== "undefined" ? import.meta : undefined');
    if (meta && meta.env) {
      for (const key of keys) {
        const val = meta.env[key];
        if (typeof val === 'string' && val.trim()) return val.trim();
      }
    }
  } catch {}

  return '';
}

export const clientEnv: ClientEnv = {
  SUPABASE_URL: readClientVar(['NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL']),
  SUPABASE_ANON_KEY: readClientVar(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']),
  GOOGLE_MAPS_API_KEY: readClientVar(['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY']),
  WS_URL: readClientVar(['NEXT_PUBLIC_WS_URL', 'VITE_WS_URL']),
  API_BASE_URL: readClientVar(['NEXT_PUBLIC_API_BASE_URL', 'VITE_API_BASE_URL', 'VITE_API_URL', 'VITE_BACKEND_URL']),
  IS_PRODUCTION: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
};

// ============================================================================
// SERVER ENVIRONMENT (Server-Only Secrets - NEVER import in Client Components)
// ============================================================================

export interface ServerEnv {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  AUTH_SECRET: string;
  GEMINI_API_KEY: string;
  DATABASE_PATH: string;
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CORS_ALLOWED_ORIGINS: string[];
  IS_VERCEL: boolean;
}

function readServerVar(keys: string[], defaultValue = ''): string {
  if (typeof window !== 'undefined') {
    // Defense-in-depth: Never return server secrets in browser context
    return '';
  }

  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const val = process.env[key];
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
  }

  return defaultValue;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('[SECURITY VIOLATION] Attempted to access getServerEnv() from a client-side browser runtime.');
  }

  const rawCors = readServerVar(['CORS_ALLOWED_ORIGINS']);
  const corsOrigins = rawCors
    ? rawCors.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  return {
    NODE_ENV: readServerVar(['NODE_ENV'], 'development'),
    PORT: parseInt(readServerVar(['PORT'], '3000'), 10) || 3000,
    HOST: readServerVar(['HOST'], '0.0.0.0'),
    AUTH_SECRET: readServerVar(['AUTH_SECRET', 'JWT_SECRET'], 'polar-ops-secret-key-2026'),
    GEMINI_API_KEY: readServerVar(['GEMINI_API_KEY']),
    DATABASE_PATH: readServerVar(['DATABASE_PATH'], './data/polar-database.json'),
    DATABASE_URL: readServerVar(['DATABASE_URL']),
    SUPABASE_URL: readServerVar(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL']),
    SUPABASE_SERVICE_ROLE_KEY: readServerVar(['SUPABASE_SERVICE_ROLE_KEY']),
    CORS_ALLOWED_ORIGINS: corsOrigins,
    IS_VERCEL: Boolean(process.env.VERCEL || process.env.NOW_BUILDER),
  };
}

// Server Environment Classification
export interface EnvValidationReport {
  valid: boolean;
  isVercel: boolean;
  required: {
    authSecret: boolean;
  };
  features: {
    geminiAi: boolean;
    supabase: boolean;
    databaseUrl: boolean;
  };
  warnings: string[];
}

export function validateServerEnvironment(): EnvValidationReport {
  if (typeof window !== 'undefined') {
    return {
      valid: true,
      isVercel: false,
      required: { authSecret: true },
      features: { geminiAi: false, supabase: false, databaseUrl: false },
      warnings: [],
    };
  }

  const env = getServerEnv();
  const warnings: string[] = [];

  const hasAuthSecret = Boolean(env.AUTH_SECRET && env.AUTH_SECRET.length >= 8);
  if (!hasAuthSecret) {
    warnings.push('AUTH_SECRET is using default fallback or is shorter than recommended 8 characters.');
  }

  const hasGemini = Boolean(env.GEMINI_API_KEY);
  if (!hasGemini) {
    warnings.push('GEMINI_API_KEY is not configured. Polar AI predictive analytics will run in deterministic fallback mode.');
  }

  const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const hasDatabaseUrl = Boolean(env.DATABASE_URL);

  return {
    valid: true, // Non-fatal warnings do not crash serverless execution
    isVercel: env.IS_VERCEL,
    required: {
      authSecret: hasAuthSecret,
    },
    features: {
      geminiAi: hasGemini,
      supabase: hasSupabase,
      databaseUrl: hasDatabaseUrl,
    },
    warnings,
  };
}

/**
 * Returns a safe boolean-only dictionary of environment variables for /api/health.
 * NEVER leaks token strings or credentials.
 */
export function getSafeEnvironmentStatus(): Record<string, boolean> {
  if (typeof window !== 'undefined') {
    return {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(clientEnv.SUPABASE_URL),
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Boolean(clientEnv.GOOGLE_MAPS_API_KEY),
    };
  }

  const env = getServerEnv();
  return {
    GEMINI_API_KEY: Boolean(env.GEMINI_API_KEY),
    AUTH_SECRET: Boolean(env.AUTH_SECRET),
    DATABASE_URL: Boolean(env.DATABASE_URL),
    DATABASE_PATH: Boolean(env.DATABASE_PATH),
    SUPABASE_URL: Boolean(env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(clientEnv.SUPABASE_URL),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Boolean(clientEnv.GOOGLE_MAPS_API_KEY),
  };
}
