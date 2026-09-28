/**
 * Centralized API & Backend Gateway Configuration
 * Single Source of Truth for all frontend API & WebSocket requests.
 */

import { isMobile, isTauri } from '../platform';

export const API_BASE_STORAGE_KEY = 'polar_api_base_url';

/**
 * Raw build-time environment variable injected by Vite.
 * Configure this in .env or via VITE_API_BASE_URL=https://<your-subdomain>.ngrok-free.app before building.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

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
 * Validates the API Base URL against runtime environment constraints (especially Android / Mobile).
 */
export function validateApiBaseUrl(url?: string | null): { valid: boolean; warning?: string; error?: string } {
  const isAndroidOrMobile = isMobile();
  const isProduction = import.meta.env.PROD;

  if (!url || !url.trim()) {
    if (isAndroidOrMobile) {
      return {
        valid: false,
        error:
          '[POLAR API CONFIG ERROR] Critical: VITE_API_BASE_URL is not configured for Android / Mobile! A physical Android phone cannot reach localhost or a blank relative origin. Please set VITE_API_BASE_URL=https://<your-subdomain>.ngrok-free.app before running `npm run build` or `npx tauri android build`.',
      };
    }
    return { valid: true };
  }

  const clean = url.trim().replace(/\/+$/, '');

  if (isLocalhost(clean)) {
    if (isAndroidOrMobile) {
      return {
        valid: false,
        error: `[POLAR API CONFIG ERROR] Critical: Android application is configured with loopback '${clean}'. A physical Android phone cannot reach localhost on your development computer! You must set VITE_API_BASE_URL=https://<your-subdomain>.ngrok-free.app in your .env before building the APK.`,
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
 * 3. Build-time environment variable (API_BASE_URL / VITE_API_BASE_URL)
 * 4. Safe platform fallbacks:
 *    - In Android / Mobile: NEVER silently fall back to localhost!
 *    - In Tauri Desktop DEV: 'http://localhost:3000'
 *    - In Web Browser DEV/PROD: relative '' (Vite proxy forwards /api to backend)
 */
export function getApiBaseUrl(): string {
  // 1. Explicit window runtime override (e.g. injected by test harnesses)
  if (typeof window !== 'undefined' && (window as any).__POLAR_API_BASE_URL__) {
    const override = String((window as any).__POLAR_API_BASE_URL__).trim().replace(/\/+$/, '');
    if (override) return override;
  }

  // 2. User-configured localStorage override (from Operations Gateway modal on device)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored && stored.trim()) {
        const cleanStored = stored.trim().replace(/\/+$/, '');
        // On mobile, if stored value is accidentally localhost, ignore it with warning
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

  // 3. Vite build-time environment variable
  if (API_BASE_URL) {
    if (isMobile() && isLocalhost(API_BASE_URL)) {
      console.error(
        `[POLAR API CONFIG ERROR] Critical: VITE_API_BASE_URL is set to localhost ('${API_BASE_URL}') on Android/Mobile! Backend requests will fail. Please set VITE_API_BASE_URL to your HTTPS ngrok tunnel URL.`
      );
      // Do not return localhost on mobile
      return '';
    }
    return API_BASE_URL;
  }

  // 4. Platform-specific fallbacks:
  // In Android/Mobile: NEVER silently fall back to localhost!
  if (isMobile()) {
    console.error(
      '[POLAR API CONFIG ERROR] No remote API Base URL configured on mobile! Physical phones cannot reach localhost:3000. Set VITE_API_BASE_URL=https://<your-subdomain>.ngrok-free.app before building.'
    );
    return '';
  }

  // In Tauri Desktop DEV: allow localhost:3000
  if (isTauri()) {
    if (import.meta.env.DEV) {
      return 'http://localhost:3000';
    }
    return '';
  }

  // In standard browser: return empty string (relative paths utilize Vite dev proxy / same-origin)
  return '';
}

/**
 * Resolves an API endpoint path to a complete URL
 */
export function apiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();

  if (isMobile() && !base) {
    console.error(`[POLAR API] Request to '${endpoint}' attempted with no remote base URL configured on mobile device!`);
  }

  let fullUrl = base ? `${base}${cleanPath}` : cleanPath;

  // For ngrok endpoints, append ngrok-skip-browser-warning=true as query parameter.
  // This bypasses ngrok's free-tier HTML warning page without triggering a CORS preflight on GET requests!
  if (fullUrl.includes('ngrok') && !fullUrl.includes('ngrok-skip-browser-warning')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}ngrok-skip-browser-warning=true`;
  }

  return fullUrl;
}

/**
 * Resolves a WebSocket URL based on configured base URL or current window host
 */
export function wsUrl(path: string = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();

  if (base) {
    try {
      const parsed = new URL(base);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}${cleanPath}`;
    } catch (e) {
      console.warn(`[POLAR API] Failed to parse API Base URL '${base}' for WebSocket, using fallback`, e);
    }
  }

  // On mobile without a base URL, do NOT connect to ws://localhost:3000
  if (isMobile()) {
    console.error('[POLAR API] Cannot initialize WebSocket on mobile device without configured remote API Base URL.');
    return '';
  }

  if (typeof window !== 'undefined' && window.location.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  return `ws://localhost:3000${cleanPath}`;
}

/**
 * Sets a runtime custom API Base URL (persisted to localStorage)
 */
export function setCustomApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/+$/, '');
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

// Initial startup validation check
const initialValidation = validateApiBaseUrl(API_BASE_URL);
if (initialValidation.error) {
  console.error(initialValidation.error);
} else if (initialValidation.warning) {
  console.warn(initialValidation.warning);
} else if (API_BASE_URL) {
  console.log(`[POLAR API] Configured Backend Gateway: ${API_BASE_URL}`);
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

