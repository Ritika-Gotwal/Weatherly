/* =========================================================
   sounds.js — satisfying UI sound effects via Web Audio API
   No external files. All tones are generated programmatically.
   ========================================================= */

let _ctx = null;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/* Generic tone builder */
function tone({ freq, endFreq, duration, volume = 0.14, type = 'sine', delay = 0 }) {
  const ctx  = getCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.01);
}

/* ---- Individual sounds ---- */

/* Bottom nav / tab switch — soft mid tap */
function playNavClick() {
  tone({ freq: 540, endFreq: 420, duration: 0.08, volume: 0.12 });
}

/* Back button — gentle descending whoosh */
function playBack() {
  tone({ freq: 420, endFreq: 290, duration: 0.10, volume: 0.10 });
}

/* City selected / weather loads — two-note rising chime */
function playCitySelect() {
  tone({ freq: 528, duration: 0.18, volume: 0.13, delay: 0 });
  tone({ freq: 660, duration: 0.18, volume: 0.11, delay: 0.10 });
}

/* Add to favorites — warm three-note ascending chime */
function playFavAdd() {
  tone({ freq: 528, duration: 0.20, volume: 0.13, type: 'triangle', delay: 0 });
  tone({ freq: 660, duration: 0.20, volume: 0.11, type: 'triangle', delay: 0.09 });
  tone({ freq: 792, duration: 0.22, volume: 0.09, type: 'triangle', delay: 0.18 });
}

/* Remove from favorites — soft two-note descent */
function playFavRemove() {
  tone({ freq: 528, duration: 0.16, volume: 0.11, delay: 0 });
  tone({ freq: 396, duration: 0.16, volume: 0.09, delay: 0.09 });
}

/* Search clear — light tick */
function playTick() {
  tone({ freq: 680, endFreq: 560, duration: 0.07, volume: 0.10 });
}
