// audio.js — tiny WebAudio synth: no sound files, everything is generated.
// Pickup chime, alarm sting, footsteps, win arpeggio and a low night drone.

let ctx = null;
let master = null;
let muted = false;
let droneNodes = null;

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function pickupSound() {
  tone(660, 0.12, 'sine', 0.25);
  tone(990, 0.18, 'sine', 0.22, 0.09);
  tone(1320, 0.22, 'sine', 0.16, 0.18);
}

export function alertSting() {
  tone(220, 0.25, 'sawtooth', 0.16, 0, 440);
  tone(233, 0.25, 'sawtooth', 0.16, 0.02, 466);
}

export function caughtSound() {
  tone(392, 0.3, 'square', 0.2, 0, 196);
  tone(311, 0.4, 'square', 0.2, 0.25, 155);
  tone(233, 0.6, 'square', 0.2, 0.55, 110);
}

export function winSound() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.22, i * 0.13));
}

export function stepSound(sneak) {
  tone(sneak ? 140 : 190, 0.05, 'sine', sneak ? 0.05 : 0.09);
}

export function laserZap() {
  tone(1200, 0.12, 'sawtooth', 0.1, 0, 300);
}

export function startDrone() {
  if (!ctx || droneNodes) return;
  try {
    const g = ctx.createGain();
    g.gain.value = 0.05;
    g.connect(master);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 55.7;
    o1.connect(g);
    o2.connect(g);
    o1.start();
    o2.start();
    droneNodes = { o1, o2, g };
  } catch (e) {
    droneNodes = null;
  }
}
