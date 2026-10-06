/**
 * Centralized Polar Operations Production API Client
 *
 * Implements relative-by-default routing for all web and mobile browsers.
 * Handles unified JSON serialization, timeouts, Bearer authentication,
 * and user-friendly structured error extraction.
 */

import { isTauri } from '../platform';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public userMessage: string;
  public rawData?: any;

  constructor(message: string, status = 500, code = 'API_ERROR', rawData?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.rawData = rawData;
    this.userMessage = sanitizeUserFacingErrorMessage(message, status);
  }
}

/**
 * Strips technical noise, stack traces, and internal secrets from error messages
 * before rendering them to expedition personnel or operations operators.
 */
export function sanitizeUserFacingErrorMessage(msg: string, status?: number): string {
  if (!msg) {
    if (status === 401) return 'Session expired or invalid credentials. Please sign in again.';
    if (status === 403) return 'Access denied. Your role is not authorized for this operation.';
    if (status === 404) return 'Requested operational resource not found.';
    if (status === 503) return 'Polar operations service is temporarily unavailable. Retrying...';
    return 'An unexpected communication error occurred. Check network connection.';
  }

  // Filter sensitive internals
  const lower = msg.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('econnrefused')) {
    return 'Polar Operations Backend is currently unreachable. Check your network or server deployment.';
  }
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return 'Operation timed out. The satellite or server link took too long to respond.';
  }
  if (lower.includes('gemini') && (lower.includes('key') || lower.includes('quota') || lower.includes('configured'))) {
    return 'Polar AI service is currently not configured or has reached quota limits.';
  }
  if (lower.includes('syntaxerror') || lower.includes('unexpected token <')) {
    return 'Server returned an invalid HTML response instead of JSON. Check backend routing.';
  }

  // Return clean message capped at reasonable length
  return msg.length > 200 ? msg.substring(0, 197) + '...' : msg;
}

export const API_BASE_STORAGE_KEY = 'polar_api_base_url';

/**
 * Normalizes backend URLs:
 * - Trims whitespace
 * - Prepends scheme if missing
 * - Strips trailing slashes
 */
export function normalizeBackendUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

/**
 * Returns the effective API Base URL.
 * In any web browser (desktop, tablet, or mobile), this returns an EMPTY STRING ('')
 * to ensure all requests use clean, same-origin relative paths (/api/...).
 * Only standalone desktop native apps (Tauri) or explicit overrides use an absolute URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Explicit window runtime override (e.g. test harness)
    if ((window as any).__POLAR_API_BASE_URL__) {
      return normalizeBackendUrl(String((window as any).__POLAR_API_BASE_URL__));
    }

    // 2. User-configured override from manual Gateway modal in localStorage (if set)
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored && stored.trim()) {
        return normalizeBackendUrl(stored);
      }
    } catch {}

    // 3. For any standard browser session (mobile, tablet, desktop):
    // Always use clean relative paths targeting the current web deployment!
    if (!isTauri()) {
      return '';
    }
  }

  // 4. In native desktop Tauri or non-browser environment, check build-time env
  const envUrl =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.VITE_API_URL ||
        (import.meta as any).env?.VITE_API_BASE_URL ||
        (import.meta as any).env?.VITE_BACKEND_URL)) ||
    '';

  return normalizeBackendUrl(envUrl);
}

/**
 * Resolves an API endpoint path to a relative or absolute URL.
 * Ensures leading slash, strips redundant /api/api prefixes, and defaults to relative paths.
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  let path = (endpoint || '').trim();

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Deduplicate /api if base ends with /api
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.substring(4);
  }

  // If running in browser and targeting same host or relative
  if (typeof window !== 'undefined' && !base) {
    return path;
  }

  return base ? `${base}${path}` : path;
}

/**
 * Resolves WebSocket URL based on current host or configured base
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  // 1. Explicit base URL configured
  if (base) {
    try {
      const parsed = new URL(base);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${cleanPath}`;
    } catch {}
  }

  // 2. Current browser origin
  if (typeof window !== 'undefined' && window.location.host) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}${cleanPath}`;
  }

  return '';
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

/**
 * Core authenticated fetch client with automatic headers, error extraction, and timeout handling.
 */
export async function apiFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const url = apiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject session token if present
  if (typeof window !== 'undefined' && !options.skipAuth && !headers.has('Authorization')) {
    const token =
      sessionStorage.getItem('polar_auth_token') ||
      localStorage.getItem('polar_auth_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Handle timeout via AbortController
  const timeoutMs = options.timeoutMs ?? (endpoint.includes('/ai/') ? 45000 : 15000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If caller already passed a signal, combine them
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError(`Request to ${endpoint} timed out after ${timeoutMs}ms.`, 408, 'TIMEOUT');
    }
    throw new ApiError(err.message || 'Network connection failed.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * High-level JSON API client with typed response parsing and structured error handling.
 */
export const api = {
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return executeJsonRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return executeJsonRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return executeJsonRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return executeJsonRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
    });
  },

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return executeJsonRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

async function executeJsonRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
  const response = await apiFetch(endpoint, options);

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorCode = 'HTTP_ERROR';

    if (responseData && typeof responseData === 'object') {
      if (responseData.error) {
        if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        } else if (responseData.error.message) {
          errorMessage = responseData.error.message;
          errorCode = responseData.error.code || errorCode;
        }
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
    }

    throw new ApiError(errorMessage, response.status, errorCode, responseData);
  }

  return responseData as T;
}
