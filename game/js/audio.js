// audio.js — small original sounds, made with the Web Audio oscillator.
// No audio files: every blip is synthesised here, so the game stays offline.
// Sound starts only after the player first interacts with the page.

export function makeAudio() {
  const audio = {
    ctx: null,
    muted: false,
    siren: null,
  };
  return audio;
}

function ensure(audio) {
  if (!audio.ctx) {
    try {
      audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function tone(audio, freq, dur, type, gain, slideTo) {
  if (audio.muted) return;
  const ctx = ensure(audio);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  amp.gain.setValueAtTime(gain || 0.08, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function bindAudio(audio) {
  return {
    pickup() { tone(audio, 880, 0.14, 'sine', 0.09); setTimeout(() => tone(audio, 1318, 0.18, 'sine', 0.08), 90); },
    deny() { tone(audio, 160, 0.16, 'square', 0.05); },
    puff() { tone(audio, 320, 0.4, 'sawtooth', 0.04, 90); },
    zap() { tone(audio, 1200, 0.25, 'square', 0.05, 200); },
    unlock() { tone(audio, 520, 0.1, 'triangle', 0.09); setTimeout(() => tone(audio, 780, 0.16, 'triangle', 0.09), 110); },
    caught() { tone(audio, 220, 0.5, 'sawtooth', 0.07, 70); },
    escape() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(audio, f, 0.22, 'triangle', 0.08), i * 120));
    },
    spotted() { tone(audio, 980, 0.1, 'square', 0.04); },
    toggleMute() {
      audio.muted = !audio.muted;
      return audio.muted;
    },
  };
}
