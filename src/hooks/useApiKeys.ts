import { useState, useEffect, useCallback } from 'react';

const STORAGE_GMAPS_KEY = 'polar_gmaps_api_key';
const STORAGE_GEMINI_KEY = 'polar_gemini_api_key';

export interface ApiKeysState {
  googleMapsApiKey: string;
  geminiApiKey: string;
  hasCustomGmaps: boolean;
  hasCustomGemini: boolean;
  setGoogleMapsApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  saveKeys: (gmapsKey: string, geminiKey: string) => void;
  clearKeys: () => void;
}

export function useApiKeys(): ApiKeysState {
  const [googleMapsApiKey, setGoogleMapsKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GMAPS_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {
      // Ignore
    }
    return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  });

  const [geminiApiKey, setGeminiKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GEMINI_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {
      // Ignore
    }
    return '';
  });

  const saveKeys = useCallback((gmapsKey: string, gemKey: string) => {
    const trimmedGmaps = gmapsKey.trim();
    const trimmedGemini = gemKey.trim();

    try {
      if (trimmedGmaps) {
        localStorage.setItem(STORAGE_GMAPS_KEY, trimmedGmaps);
      } else {
        localStorage.removeItem(STORAGE_GMAPS_KEY);
      }

      if (trimmedGemini) {
        localStorage.setItem(STORAGE_GEMINI_KEY, trimmedGemini);
      } else {
        localStorage.removeItem(STORAGE_GEMINI_KEY);
      }
    } catch (e) {
      console.error('Failed to save API keys in localStorage:', e);
    }

    setGoogleMapsKey(trimmedGmaps);
    setGeminiKey(trimmedGemini);
  }, []);

  const setGoogleMapsApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_GMAPS_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_GMAPS_KEY);
      }
    } catch (e) {
      // Ignore
    }
    setGoogleMapsKey(trimmed);
  }, []);

  const setGeminiApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_GEMINI_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_GEMINI_KEY);
      }
    } catch (e) {
      // Ignore
    }
    setGeminiKey(trimmed);
  }, []);

  const clearKeys = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_GMAPS_KEY);
      localStorage.removeItem(STORAGE_GEMINI_KEY);
    } catch (e) {
      // Ignore
    }
    setGoogleMapsKey('');
    setGeminiKey('');
  }, []);

  return {
    googleMapsApiKey,
    geminiApiKey,
    hasCustomGmaps: Boolean(googleMapsApiKey && googleMapsApiKey.trim()),
    hasCustomGemini: Boolean(geminiApiKey && geminiApiKey.trim()),
    setGoogleMapsApiKey,
    setGeminiApiKey,
    saveKeys,
    clearKeys,
  };
}
