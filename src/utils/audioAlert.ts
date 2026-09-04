/**
 * Web Audio API Polar Emergency Klaxon & Tactical Sound Synthesizer
 * Zero external audio files required - works completely offline.
 */

let audioCtx: AudioContext | null = null;
let alarmInterval: number | null = null;
let isAlarmPlaying = false;

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
 */
export function startEmergencyAlarm(): void {
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
  } catch (e) {
    console.warn('[AUDIO] Audio alert failed to initialize:', e);
  }
}

/**
 * Stop the emergency alarm
 */
export function stopEmergencyAlarm(): void {
  isAlarmPlaying = false;
  if (alarmInterval !== null) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

/**
 * Play single tactical chirp (e.g. for message incoming or status change)
 */
export function playTacticalChirp(): void {
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
 * Play reassurance / success chime (e.g. HQ Acknowledged or SAR Arrived)
 */
export function playSuccessChime(): void {
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
