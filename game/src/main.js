// main.js — game loop and rules for The Kencana Job.
// One room, three relics, three guards, two cameras, one laser gate.
// Seen in a cone, the alarm climbs; hidden, it falls; at 100 you are caught.

import { W, H, PLAYER_R, WALK_SPEED, SNEAK_SPEED, GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_RANGE, GUARD_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE, ALARM_MAX, ALARM_DECAY } from './config.js';
import { LOOT, CAMERAS, GUARD_DEFS, LASERS, SPAWN, EXIT, segBlocked, pointInShadow, moveCircle } from './world.js';
import { keys, initInput, moveVector, sneaking, pressed } from './input.js';
import { draw } from './render.js';
import * as audio from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function freshState() {
  return {
    mode: 'title',
    time: 0,
    alarm: 0,
    lootTaken: [false, false, false],
    lootCount: 0,
    player: { x: SPAWN.x, y: SPAWN.y, angle: -Math.PI / 2, sneak: false, moving: false },
    guards: GUARD_DEFS.map((def) => ({
      id: def.id,
      name: def.name,
      x: def.waypoints[0][0],
      y: def.waypoints[0][1],
      angle: 0,
      wpIndex: 1,
      state: 'patrol',
      loseT: 0,
    })),
    cameras: CAMERAS.map((c) => ({ id: c.id, x: c.x, y: c.y, angle: c.base })),
    lasersOn: {},
    winTime: 0,
    caughtReason: '',
    frozen: false,
    shotName: null,
    stepT: 0,
    zapT: 0,
  };
}

let state = freshState();

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this watcher (at x,y, facing angle) see the player right now?
function canSee(x, y, angle, halfAngle, range) {
  const p = state.player;
  const dx = p.x - x;
  const dy = p.y - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return { seen: false, dist };
  if (segBlocked(x, y, p.x, p.y)) return { seen: false, dist };
  return { seen: true, dist };
}

function detectionRate(dist, base) {
  let rate = base;
  if (dist < 120) rate *= 1.6;
  if (state.player.sneak) rate *= 0.5;
  if (pointInShadow(state.player.x, state.player.y)) rate *= 0.45;
  return rate;
}

function updateGuards(dt) {
  for (const g of state.guards) {
    const def = GUARD_DEFS[g.id];
    const see = canSee(g.x, g.y, g.angle, GUARD_HALF_ANGLE, GUARD_RANGE);
    if (see.seen) {
      state.alarm += detectionRate(see.dist, 46) * dt;
      g.angle = Math.atan2(state.player.y - g.y, state.player.x - g.x);
      g.state = state.alarm > 60 ? 'chase' : state.alarm > 35 ? 'suspect' : 'patrol';
      g.loseT = 0;
      if (g.state !== 'patrol') {
        const speed = g.state === 'chase' ? GUARD_CHASE_SPEED : 72;
        const dx = state.player.x - g.x;
        const dy = state.player.y - g.y;
        const d = Math.hypot(dx, dy) || 1;
        const pos = moveCircle(g.x, g.y, 14, (dx / d) * speed * dt, (dy / d) * speed * dt);
        g.x = pos.x;
        g.y = pos.y;
      }
    } else {
      g.loseT += dt;
      if (g.loseT > 2.5 && g.state !== 'patrol') {
        g.state = 'patrol';
      }
      if (g.state === 'patrol') {
        const [tx, ty] = def.waypoints[g.wpIndex];
        const dx = tx - g.x;
        const dy = ty - g.y;
        const d = Math.hypot(dx, dy);
        if (d < 6) {
          g.wpIndex = (g.wpIndex + 1) % def.waypoints.length;
        } else {
          g.angle = Math.atan2(dy, dx);
          const pos = moveCircle(g.x, g.y, 14, (dx / d) * GUARD_PATROL_SPEED * dt, (dy / d) * GUARD_PATROL_SPEED * dt);
          g.x = pos.x;
          g.y = pos.y;
        }
      }
    }
  }
}

function updateCameras(dt) {
  state.cameras.forEach((cam, i) => {
    const def = CAMERAS[i];
    cam.angle = def.base + Math.sin(state.time * def.speed + def.phase) * def.sweep;
    const see = canSee(cam.x, cam.y, cam.angle, CAMERA_HALF_ANGLE, CAMERA_RANGE);
    if (see.seen) {
      state.alarm += detectionRate(see.dist, 30) * dt;
    }
  });
}

function updateLasers(dt) {
  for (const l of LASERS) {
    const on = ((state.time + l.phase) % l.period) < l.on;
    state.lasersOn[l.y] = on;
    if (!on) continue;
    const p = state.player;
    if (p.x > l.x0 && p.x < l.x1 && Math.abs(p.y - l.y) < PLAYER_R + 3) {
      state.alarm += 55 * dt;
      if (state.time - state.zapT > 0.4) {
        state.zapT = state.time;
        audio.laserZap();
      }
    }
  }
}

function updatePlayer(dt) {
  const mv = moveVector();
  const sneak = sneaking();
  const speed = sneak ? SNEAK_SPEED : WALK_SPEED;
  const p = state.player;
  p.sneak = sneak;
  p.moving = mv.x !== 0 || mv.y !== 0;
  if (p.moving) {
    p.angle = Math.atan2(mv.y, mv.x);
    const pos = moveCircle(p.x, p.y, PLAYER_R, mv.x * speed * dt, mv.y * speed * dt);
    p.x = pos.x;
    p.y = pos.y;
    state.stepT += dt;
    if (state.stepT > (sneak ? 0.5 : 0.32)) {
      state.stepT = 0;
      audio.stepSound(sneak);
    }
  }
  // Loot pickup.
  for (const item of LOOT) {
    if (!state.lootTaken[item.id] && Math.hypot(p.x - item.x, p.y - item.y) < 30) {
      state.lootTaken[item.id] = true;
      state.lootCount += 1;
      audio.pickupSound();
    }
  }
  // Exit.
  if (state.lootCount >= 3 && p.x > EXIT.x - 6 && p.x < EXIT.x + EXIT.w + 6 && p.y > EXIT.y - 10) {
    state.mode = 'win';
    state.winTime = state.time;
    audio.winSound();
  }
}

function update(dt) {
  if (state.mode !== 'playing') return;
  state.time += dt;
  const prevAlarm = state.alarm;
  updatePlayer(dt);
  if (state.mode !== 'playing') return; // player may have won
  updateGuards(dt);
  updateCameras(dt);
  updateLasers(dt);
  // Alarm decays while nobody sees the thief.
  const anySeen = state.guards.some((g) => g.state !== 'patrol');
  if (!anySeen) {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
  if (prevAlarm < 70 && state.alarm >= 70) audio.alertSting();
  state.alarm = Math.max(0, Math.min(ALARM_MAX, state.alarm));
  if (state.alarm >= ALARM_MAX) {
    state.mode = 'caught';
    state.caughtReason = 'a guard raised the alarm';
    audio.caughtSound();
  }
}

function frame(ts) {
  requestAnimationFrame(frame);
  const now = ts / 1000;
  if (frame.last === undefined) frame.last = now;
  let dt = Math.min(0.05, now - frame.last);
  frame.last = now;
  if (state.frozen) {
    draw(ctx, state);
    return;
  }
  if (state.mode === 'title' && pressed('Enter')) {
    state.mode = 'playing';
    audio.ensureAudio();
    audio.startDrone();
  } else if ((state.mode === 'caught' || state.mode === 'win') && pressed('KeyR')) {
    state = freshState();
    state.mode = 'playing';
    audio.ensureAudio();
  } else if (state.mode === 'playing' && pressed('KeyR')) {
    state = freshState();
    state.mode = 'playing';
  }
  if (pressed('KeyM')) {
    audio.setMuted(!audio.isMuted());
  }
  update(dt);
  draw(ctx, state);
  void keys;
}

initInput(() => audio.ensureAudio());

// Screenshot presets: ?shot=cover|alert|vault|title freezes one real game state.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(state, shot);
  state.frozen = true;
  state.shotName = shot;
  draw(ctx, state);
} else {
  requestAnimationFrame(frame);
}
