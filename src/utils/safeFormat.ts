import React from 'react';

/**
 * Checks if a value is a plain JavaScript object
 */
export function isPlainObject(val: unknown): val is Record<string, any> {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Error) &&
    !React.isValidElement(val)
  );
}

/**
 * Safely format an error into a human-readable string.
 * Handles:
 * - string, number, boolean
 * - null, undefined
 * - Error instances (DOMException, GeolocationPositionError, TypeError, etc.)
 * - Objects with { code, message }
 * - Objects with { error: { code, message } }
 * - Objects with { error: string }
 * - Objects with { statusText } or { reason }
 * - JSON-RPC / API response shapes
 * - Arrays of errors
 */
export function formatError(error: unknown, fallback: string = 'An unknown system event occurred.'): string {
  if (error === null || error === undefined) {
    return fallback;
  }

  // Primitive strings
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  // Primitive numbers / booleans
  if (typeof error === 'number' || typeof error === 'boolean') {
    return String(error);
  }

  // Standard Error instances
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) {
      // Decode minified React error #31 if present
      if (msg.includes('Minified React error #31') || msg.includes('react.dev/errors/31')) {
        return 'React Render Error (Error #31): An object was passed directly as a React child instead of a string or number.';
      }
      return msg;
    }
    return error.name || fallback;
  }

  // Objects
  if (typeof error === 'object') {
    const obj = error as Record<string, any>;

    // Case: nested { error: { code, message } } or { error: string }
    if ('error' in obj && obj.error !== undefined && obj.error !== null) {
      return formatError(obj.error, fallback);
    }

    // Case: { code, message } (Standard Vercel 404, GeolocationPositionError, Google API errors)
    if ('message' in obj && obj.message !== undefined && obj.message !== null) {
      const msgStr = typeof obj.message === 'string' ? obj.message.trim() : formatError(obj.message, '');
      if (msgStr) {
        if ('code' in obj && obj.code !== undefined && obj.code !== null && typeof obj.code !== 'object') {
          // If message already contains code, don't duplicate
          const codeStr = String(obj.code);
          return msgStr.includes(codeStr) ? msgStr : `[${codeStr}] ${msgStr}`;
        }
        return msgStr;
      }
    }

    // Case: { code } only
    if ('code' in obj && obj.code !== undefined && obj.code !== null) {
      return `Error code: ${String(obj.code)}`;
    }

    // Case: { statusText }
    if ('statusText' in obj && typeof obj.statusText === 'string' && obj.statusText.trim()) {
      return obj.statusText.trim();
    }

    // Case: { reason }
    if ('reason' in obj && obj.reason !== undefined && obj.reason !== null) {
      return formatError(obj.reason, fallback);
    }

    // Case: { details }
    if ('details' in obj && typeof obj.details === 'string' && obj.details.trim()) {
      return obj.details.trim();
    }

    // Case: Array of errors
    if (Array.isArray(error)) {
      const formatted = error.map((e) => formatError(e, '')).filter(Boolean);
      return formatted.length > 0 ? formatted.join('; ') : fallback;
    }

    // Fallback serialization without crashing
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {
      // JSON circular reference or serialization failure
    }
  }

  return fallback;
}

/**
 * Format a telemetry value (temperature, wind, coordinates, speed, battery, etc.)
 * Ensures that nested objects (e.g. coordinates or compound readings) never crash React.
 */
export function formatTelemetryValue(val: unknown, fallback: string = 'N/A'): string {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }

  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return fallback;
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }

  if (typeof val === 'string') {
    return val;
  }

  if (typeof val === 'boolean') {
    return val ? 'NOMINAL' : 'OFFLINE';
  }

  if (typeof val === 'object') {
    const obj = val as Record<string, any>;

    // Compound reading with { value, unit }
    if ('value' in obj) {
      const formattedNum = formatTelemetryValue(obj.value, fallback);
      return obj.unit ? `${formattedNum} ${obj.unit}` : formattedNum;
    }

    // Weather point { tempC, apparentTempC }
    if ('tempC' in obj) {
      return `${obj.tempC}°C`;
    }

    // Lat/Lng point { lat, lng }
    if ('lat' in obj && 'lng' in obj && typeof obj.lat === 'number' && typeof obj.lng === 'number') {
      return `${obj.lat.toFixed(2)}°, ${obj.lng.toFixed(2)}°`;
    }

    // Entity with name or label
    if ('name' in obj && typeof obj.name === 'string') {
      return obj.name;
    }
    if ('label' in obj && typeof obj.label === 'string') {
      return obj.label;
    }

    // Array of metrics
    if (Array.isArray(val)) {
      return val.map((v) => formatTelemetryValue(v, fallback)).join(', ');
    }

    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }

  return String(val);
}

/**
 * Formats an API response or error payload into a safe human-readable message.
 */
export function formatApiResponse(response: unknown): string {
  if (!response) return '';
  if (typeof response === 'string') return response;

  if (typeof response === 'object') {
    const obj = response as Record<string, any>;
    if (obj.error) return formatError(obj.error);
    if (obj.message) return formatError(obj.message);
    if (obj.statusText) return String(obj.statusText);
    if (obj.status && typeof obj.status === 'string') return obj.status;
    if (obj.data) return formatApiResponse(obj.data);
  }

  return formatError(response);
}

/**
 * Safe Display Value for JSX children.
 * Ensures NO OBJECT (including { code, message }) is ever passed directly to React.
 *
 * Rules:
 * - null / undefined -> fallback || null
 * - string / number -> returned as is
 * - boolean -> null (standard React behavior)
 * - React.isValidElement -> returned as is! (Preserves JSX elements like icons and badges)
 * - Error instance -> formatted error string
 * - Object with { code, message } -> formatted string e.g. "[code] message" or "message"
 * - Object with { name } -> name string
 * - Object with { label } -> label string
 * - Object with { title } -> title string
 * - Any other object -> safely converted to string or fallback, NEVER passes raw object to React!
 */
export function safeDisplayValue(val: unknown, fallback: React.ReactNode = null): React.ReactNode {
  if (val === null || val === undefined) {
    return fallback;
  }

  if (typeof val === 'string' || typeof val === 'number') {
    return val;
  }

  if (typeof val === 'boolean') {
    return null;
  }

  // CRITICAL: Preserve React elements (e.g. <Badge />, <Icon />, <div>...</div>)
  if (React.isValidElement(val)) {
    return val;
  }

  if (val instanceof Error) {
    return formatError(val);
  }

  if (Array.isArray(val)) {
    // If array of React elements or primitives, map each through safeDisplayValue
    return val.map((item, idx) =>
      React.createElement(React.Fragment, { key: idx }, safeDisplayValue(item, null))
    );
  }

  if (typeof val === 'object') {
    const obj = val as Record<string, any>;

    // Case: { code, message }
    if ('message' in obj || 'code' in obj) {
      return formatError(obj);
    }

    // Case: { error }
    if ('error' in obj && obj.error !== undefined) {
      return formatError(obj.error);
    }

    // Common entity descriptors
    if ('label' in obj && typeof obj.label === 'string') {
      return obj.label;
    }
    if ('name' in obj && typeof obj.name === 'string') {
      return obj.name;
    }
    if ('title' in obj && typeof obj.title === 'string') {
      return obj.title;
    }
    if ('location' in obj) {
      return safeDisplayValue(obj.location);
    }
    if ('lat' in obj && 'lng' in obj && typeof obj.lat === 'number' && typeof obj.lng === 'number') {
      return `${obj.lat.toFixed(2)}°, ${obj.lng.toFixed(2)}°`;
    }

    try {
      const str = JSON.stringify(val);
      return str !== '{}' ? str : (fallback || null);
    } catch {
      return fallback || null;
    }
  }

  return String(val);
}
