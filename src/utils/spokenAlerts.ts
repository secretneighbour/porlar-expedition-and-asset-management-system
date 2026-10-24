/**
 * POLARIS — Spoken Mayday Emergency Voice Synthesizer (Web Speech API)
 * Provides high-priority phonetic voice alerts for polar Mayday events.
 * Fully configurable, strictly deduplicated, with zero mutation to distress records.
 */

import { ActiveDistressAlert } from '../types';

let isVoiceAlertsEnabled = false;
const announcedBeaconIds = new Set<string>();
let lastSpeechTimestamp = 0;
const SPEECH_MIN_COOLDOWN_MS = 8000; // 8-second throttle between announcements

/**
 * Initializes voice alert state from local storage preference.
 */
export function getSpokenMaydayEnabled(): boolean {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('polar_spoken_mayday_alerts');
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return isVoiceAlertsEnabled;
}

/**
 * Enables or disables spoken Mayday voice announcements.
 */
export function setSpokenMaydayEnabled(enabled: boolean): void {
  isVoiceAlertsEnabled = enabled;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('polar_spoken_mayday_alerts', String(enabled));
  }
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Clears deduplication cache (e.g. for testing or fresh missions).
 */
export function clearSpokenDeduplicationCache(): void {
  announcedBeaconIds.clear();
  lastSpeechTimestamp = 0;
}

/**
 * Constructs clean, clear phonetic emergency speech text.
 */
export function buildPhoneticMaydayText(alert: ActiveDistressAlert): string {
  const type = alert.incidentType || 'Polar Emergency Distress Beacon';
  let latStr = '';
  let lngStr = '';
  if (typeof alert.targetLat === 'number') {
    latStr = `${Math.abs(alert.targetLat).toFixed(1)} degrees ${alert.targetLat < 0 ? 'South' : 'North'}`;
  }
  if (typeof alert.targetLng === 'number') {
    lngStr = `${Math.abs(alert.targetLng).toFixed(1)} degrees ${alert.targetLng < 0 ? 'West' : 'East'}`;
  }
  const loc = alert.location ? `Location: ${alert.location}.` : '';
  const nearest = alert.autonomousSAR?.nearestBaseName ? `Nearest base: ${alert.autonomousSAR.nearestBaseName}.` : '';

  return `Mayday. Mayday. Critical Distress. ${type}. ${loc} ${latStr} ${lngStr}. ${nearest} All stations stand by for SAR dispatch.`.trim();
}

export interface SpeakMaydayResult {
  spoken: boolean;
  reason?: 'disabled' | 'unsupported' | 'deduplicated' | 'throttled' | 'muted' | 'success';
  transcript?: string;
}

/**
 * Dispatches spoken Mayday alert if enabled and not previously announced.
 */
export function speakMaydayAlert(
  alert: ActiveDistressAlert | null | undefined,
  options?: { isMuted?: boolean; force?: boolean }
): SpeakMaydayResult {
  if (!alert || !alert.id) {
    return { spoken: false, reason: 'unsupported' };
  }

  // 1. Check mute state
  if (options?.isMuted) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return { spoken: false, reason: 'muted' };
  }

  // 2. Check enabled state
  if (!options?.force && !getSpokenMaydayEnabled()) {
    return { spoken: false, reason: 'disabled' };
  }

  // 3. Check Web Speech API support
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      spoken: false,
      reason: 'unsupported',
      transcript: buildPhoneticMaydayText(alert),
    };
  }

  // 4. Deduplication & Throttling
  const now = Date.now();
  if (!options?.force) {
    if (announcedBeaconIds.has(alert.id)) {
      return { spoken: false, reason: 'deduplicated' };
    }
    if (now - lastSpeechTimestamp < SPEECH_MIN_COOLDOWN_MS) {
      return { spoken: false, reason: 'throttled' };
    }
  }

  // 5. Construct Speech Utterance
  const text = buildPhoneticMaydayText(alert);
  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly elevated tactical pitch for clarity
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
    announcedBeaconIds.add(alert.id);
    lastSpeechTimestamp = now;

    return { spoken: true, reason: 'success', transcript: text };
  } catch (err) {
    return { spoken: false, reason: 'unsupported', transcript: text };
  }
}
