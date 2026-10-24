/**
 * Web Audio API Polar Emergency Klaxon & Tactical Sound Synthesizer
 * Zero external audio files required - works completely offline.
 */

let audioCtx: AudioContext | null = null;
let alarmInterval: number | null = null;
let alarmAutoStopTimeout: number | null = null;
let isAlarmPlaying = false;

let lastChirpTime = 0;
const CHIRP_THROTTLE_MS = 250;

let lastChimeTime = 0;
const CHIME_THROTTLE_MS = 500;

/**
 * Global audio configuration backed by localStorage
 */
export function getSoundEffectsEnabled(): boolean {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('polar_sound_enabled');
    if (saved !== null) {
      return saved !== 'false';
    }
  }
  return true;
}

export function setSoundEffectsEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('polar_sound_enabled', String(enabled));
  }
  if (!enabled) {
    stopEmergencyAlarm();
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Start the pulsating two-tone polar emergency alarm (880Hz - 660Hz)
 * Respects sound setting and auto-silences after 30s to prevent runaway loops.
 */
export function startEmergencyAlarm(): void {
  if (!getSoundEffectsEnabled()) return;
  if (isAlarmPlaying) return;
  try {
    const ctx = getAudioContext();
    isAlarmPlaying = true;

    let toneToggle = false;

    const playPulse = () => {
      if (!isAlarmPlaying) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(toneToggle ? 880 : 587.33, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.38);

      toneToggle = !toneToggle;
    };

    playPulse();
    alarmInterval = window.setInterval(playPulse, 400);

    // Auto-silence safety timeout (30 seconds) to prevent infinite alarm playback
    if (alarmAutoStopTimeout !== null) {
      clearTimeout(alarmAutoStopTimeout);
    }
    alarmAutoStopTimeout = window.setTimeout(() => {
      stopEmergencyAlarm();
    }, 30000);
  } catch (e) {
    console.warn('[AUDIO] Audio alert failed to initialize:', e);
  }
}

/**
 * Stop the emergency alarm and clear repeating intervals
 */
export function stopEmergencyAlarm(): void {
  isAlarmPlaying = false;
  if (alarmInterval !== null) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmAutoStopTimeout !== null) {
    clearTimeout(alarmAutoStopTimeout);
    alarmAutoStopTimeout = null;
  }
}

/**
 * Play single tactical chirp (throttled and user-controllable)
 */
export function playTacticalChirp(): void {
  if (!getSoundEffectsEnabled()) return;

  const now = Date.now();
  if (now - lastChirpTime < CHIRP_THROTTLE_MS) return;
  lastChirpTime = now;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    // Audio contexts require user interaction first
  }
}

/**
 * Play reassurance / success chime (throttled and user-controllable)
 */
export function playSuccessChime(): void {
  if (!getSoundEffectsEnabled()) return;

  const now = Date.now();
  if (now - lastChimeTime < CHIME_THROTTLE_MS) return;
  lastChimeTime = now;

  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.45);
    });
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}
