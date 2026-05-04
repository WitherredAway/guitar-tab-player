/**
 * Theme-aware UI click sounds using Web Audio API.
 * Each theme has a distinct sonic character — no external audio files needed.
 */

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

const THEME_SOUNDS = {
  neumorphic: { freq: 880, type: 'sine', dur: 0.06, vol: 0.12 },
  glassmorphic: { freq: 1200, type: 'sine', dur: 0.08, vol: 0.08 },
  cyberpunk: { freq: 660, type: 'square', dur: 0.04, vol: 0.07 },
  retro: { freq: 500, type: 'triangle', dur: 0.07, vol: 0.10 },
  midnight: { freq: 1000, type: 'sine', dur: 0.05, vol: 0.06 },
};

export function playClick(theme = 'neumorphic') {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const cfg = THEME_SOUNDS[theme] || THEME_SOUNDS.neumorphic;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(cfg.freq * 0.5, ac.currentTime + cfg.dur);
    gain.gain.setValueAtTime(cfg.vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + cfg.dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + cfg.dur);
  } catch { /* silent fallback */ }
}
