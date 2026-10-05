/**
 * Centralized API & Backend Gateway Configuration
 * Single Source of Truth for all frontend API & WebSocket requests.
 */

import { isMobile, isTauri } from '../platform';

export const API_BASE_STORAGE_KEY = 'polar_api_base_url';

/**
 * Authoritative default backend gateway URL.
 * Centralized Single Source of Truth for production mobile deployments.
 */
export const DEFAULT_BACKEND_URL = 'https://polar-expedition-and-asset-management-system-4cmpww9cj.vercel.app';

/**
 * Normalizes backend URLs:
 * - Trims whitespace
 * - Automatically prepends https:// (or http:// for localhost/IPs) if scheme is missing
 * - Strips trailing slashes
 */
export function normalizeBackendUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    if (isLocalhost(url)) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  return url.replace(/\/+$/, '');
}

/**
 * Raw build-time environment variable injected by Vite.
 * Reads VITE_API_URL, VITE_API_BASE_URL, or VITE_BACKEND_URL.
 * In a web deployment (like Vercel), defaults to empty string so requests use relative paths (/api/...).
 */
export const API_BASE_URL: string = normalizeBackendUrl(
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  ''
);

/**
 * Helper to check if a target URL points to loopback/localhost
 */
export function isLocalhost(url?: string | null): boolean {
  if (!url) return false;
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i.test(url.trim());
}

/**
 * Checks if a target URL is an ngrok tunnel
 */
export function isNgrokUrl(url?: string | null): boolean {
  if (!url) return false;
  return /ngrok(-free)?\.(app|io)/i.test(url);
}

/**
 * Validates the API Base URL against runtime environment constraints.
 */
export function validateApiBaseUrl(url?: string | null): { valid: boolean; warning?: string; error?: string } {
  const isAndroidOrMobile = isMobile();
  const isProduction = import.meta.env.PROD;

  if (!url || !url.trim()) {
    // Relative paths are expected, secure, and valid on web / Vercel
    return { valid: true };
  }

  const clean = normalizeBackendUrl(url);

  if (isLocalhost(clean)) {
    if (isAndroidOrMobile) {
      return {
        valid: false,
        error: `[POLAR API CONFIG ERROR] Critical: Android application is configured with loopback '${clean}'. A physical Android phone cannot reach localhost on your development computer!`,
      };
    }
    if (isProduction && isTauri()) {
      return {
        valid: true,
        warning: `[POLAR API CONFIG WARNING] Production Tauri desktop build is targeting '${clean}'. For field deployment, ensure a remote base station URL is specified.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Retrieves the effective API Base URL with precedence:
 * 1. Window runtime override (window.__POLAR_API_BASE_URL__)
 * 2. User-configured override in localStorage ('polar_api_base_url')
 * 3. Build-time environment variable (VITE_API_URL / VITE_API_BASE_URL)
 * 4. Android / Mobile fallback (DEFAULT_BACKEND_URL)
 * 5. Web environment default: empty string '' (for clean relative paths like /api/auth/login)
 */
export function getApiBaseUrl(): string {
  // 1. Explicit window runtime override (e.g. injected by test harnesses)
  if (typeof window !== 'undefined' && (window as any).__POLAR_API_BASE_URL__) {
    const override = normalizeBackendUrl(String((window as any).__POLAR_API_BASE_URL__));
    if (override) return override;
  }

  // 2. User-configured localStorage override (from Operations Gateway modal on device)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored && stored.trim()) {
        const cleanStored = normalizeBackendUrl(stored);
        if (isMobile() && isLocalhost(cleanStored)) {
          console.warn(`[POLAR API] Discarding stale localhost override on mobile device: ${cleanStored}`);
        } else {
          return cleanStored;
        }
      }
    } catch {
      // localStorage may fail in restricted/private contexts
    }
  }

  // 3. Build-time environment variable (VITE_API_URL or VITE_API_BASE_URL)
  if (API_BASE_URL) {
    if (isMobile() && isLocalhost(API_BASE_URL)) {
      console.warn(
        `[POLAR API CONFIG] Localhost URL detected on mobile ('${API_BASE_URL}'); automatically falling back to central gateway: ${DEFAULT_BACKEND_URL}`
      );
      return DEFAULT_BACKEND_URL;
    }
    return API_BASE_URL;
  }

  // 4. On Android / Mobile: relative URLs cannot resolve against a remote origin, so use gateway fallback
  if (isMobile()) {
    return DEFAULT_BACKEND_URL;
  }

  // 5. In standard browser / web (including Vercel deployment):
  // Return empty string so all requests use clean relative paths (e.g. '/api/auth/login')
  return '';
}

/**
 * Resolves an API endpoint path to a URL.
 * In web / Vercel environments without an external API_BASE_URL, returns the clean relative path.
 * Guarantees no double slashes, handles trailing slashes, and avoids duplicate /api/api.
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  let path = (endpoint || '').trim();

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Deduplicate /api prefix if base already ends with /api
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.substring(4);
  }

  let fullUrl = base ? `${base}${path}` : path;

  // For ngrok endpoints, append ngrok-skip-browser-warning=true as query parameter.
  if (fullUrl.includes('ngrok') && !fullUrl.includes('ngrok-skip-browser-warning')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}ngrok-skip-browser-warning=true`;
  }

  return fullUrl;
}

/**
 * Resolves a WebSocket URL based on configured base URL or current window host.
 * Automatically derives wss:// for https and ws:// for http.
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  if (base && !isLocalhost(base)) {
    try {
      const parsed = new URL(base);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${cleanPath}`;
    } catch (e) {
      console.warn(`[POLAR API] Failed to parse API Base URL '${base}' for WebSocket, using fallback`, e);
    }
  }

  // In browser, derive directly from current origin
  if (typeof window !== 'undefined' && window.location.host && !isMobile()) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  // Fallback for mobile / non-browser
  try {
    const parsed = new URL(DEFAULT_BACKEND_URL);
    const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${parsed.host}${cleanPath}`;
  } catch {
    return `wss://polar-expedition-and-asset-management-system-4cmpww9cj.vercel.app${cleanPath}`;
  }
}

/**
 * Sets a runtime custom API Base URL (persisted to localStorage)
 */
export function setCustomApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const clean = normalizeBackendUrl(url);
    if (clean) {
      localStorage.setItem(API_BASE_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(API_BASE_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('polar:api_base_changed', { detail: clean }));
  }
}

/**
 * Clears runtime custom API Base URL override
 */
export function clearCustomApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_BASE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('polar:api_base_changed', { detail: '' }));
  }
}

// Global automatic ngrok bypass injection for browser/webview environments
if (typeof window !== 'undefined') {
  try {
    // Attempt setting cookie for ngrok interstitial bypass
    document.cookie = 'ngrok-skip-browser-warning=69420; path=/; max-age=31536000; SameSite=None; Secure';
  } catch {}

  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let isNgrok = false;
      if (typeof input === 'string') {
        isNgrok = isNgrokUrl(input);
      } else if (input instanceof URL) {
        isNgrok = isNgrokUrl(input.toString());
      } else if (input instanceof Request) {
        isNgrok = isNgrokUrl(input.url);
      }

      if (isNgrok || (API_BASE_URL && isNgrokUrl(API_BASE_URL))) {
        init = init || {};
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
        if (!headers.has('ngrok-skip-browser-warning')) {
          headers.set('ngrok-skip-browser-warning', '69420');
        }
        init.headers = headers;
      }
      return originalFetch.call(this, input, init);
    };
  }
}
