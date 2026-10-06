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

// Re-export centralized URL configuration from Single Source of Truth
export {
  API_BASE_STORAGE_KEY,
  normalizeBackendUrl,
  getApiBaseUrl,
  apiUrl,
  wsUrl,
} from '../config/api';

import {
  apiUrl,
  getApiBaseUrl,
} from '../config/api';

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
      credentials: options.credentials ?? 'include',
      ...options,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError(`Request to ${endpoint} timed out after ${timeoutMs}ms.`, 408, 'TIMEOUT');
    }
    const cleanUrl = url.split('?')[0];
    throw new ApiError(
      `Network/CORS connection failed reaching ${cleanUrl}: ${err.message || 'Check network connection and backend CORS.'}`,
      0,
      'NETWORK_ERROR'
    );
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
