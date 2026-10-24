/**
 * Vercel Serverless Function Helper & Request Pipeline
 * Provides unified CORS handling, body parsing, auth extraction, and structured JSON output.
 */

import { handleCors } from '../lib/cors';
import { extractAuthUser, checkUserRole, AuthSessionUser } from './auth';

export async function parseJsonBody<T = any>(req: any): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }

  // Streamed body
  return new Promise<T>((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : ({} as T));
      } catch {
        resolve({} as T);
      }
    });
    req.on('error', () => {
      resolve({} as T);
    });
  });
}

export function sendJson(res: any, data: any, statusCode = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export function sendSuccess(res: any, data: any, statusCode = 200) {
  sendJson(
    res,
    {
      success: true,
      ok: true,
      ...data,
    },
    statusCode
  );
}

export function sendError(res: any, message: string, statusCode = 500, code = 'ERROR', details?: any) {
  sendJson(
    res,
    {
      success: false,
      ok: false,
      error: {
        code,
        message,
        details,
      },
      message, // legacy compatibility
    },
    statusCode
  );
}

export function authenticateServerlessRequest(
  req: any,
  res: any,
  allowedRoles?: string[]
): AuthSessionUser | null {
  const auth = extractAuthUser(req.headers, req.query);

  if (!auth.authorized || !auth.user) {
    sendError(res, auth.error || 'Authentication required.', 401, 'UNAUTHORIZED');
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = checkUserRole(auth.user, allowedRoles);
    if (!hasRole) {
      sendError(
        res,
        `Role authorization mismatch. Required role: ${allowedRoles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
      return null;
    }
  }

  return auth.user;
}

export { handleCors };
