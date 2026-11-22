// shots.js — frozen, deterministic states for the entry's screenshots.
// Each preset is a real game state (positions, alarm, loot), rendered by the
// game's own code with the clock stopped. The cover shows the whole heist
// in one frame: thief, guard cones, camera cones, loot, lasers and alarm.

import { GUARD_DEFS } from './world.js';

function placeGuard(state, id, x, y, angle, mode) {
  const g = state.guards[id];
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.state = mode || 'patrol';
  g.loseT = 0;
  void GUARD_DEFS;
}

export function applyShot(state, name) {
  state.mode = 'playing';
  if (name === 'title') {
    state.mode = 'title';
    state.time = 0;
    state.alarm = 0;
    return;
  }
  if (name === 'cover') {
    // Sneaking behind the centre pedestal, Kris already lifted, a guard
    // closing in and a camera sweeping overhead. Alarm low but climbing.
    state.time = 47;
    state.alarm = 22;
    state.lootTaken = [true, false, false];
    state.lootCount = 1;
    state.player = { x: 430, y: 470, angle: -Math.PI / 2, sneak: true, moving: false };
    placeGuard(state, 0, 300, 430, -0.4, 'patrol');
    placeGuard(state, 1, 760, 300, Math.PI * 0.9, 'patrol');
    placeGuard(state, 2, 512, 380, 2.31, 'suspect');
    state.cameras[0].angle = Math.PI / 2 - 0.5;
    state.cameras[1].angle = Math.PI / 2 + 0.45;
    state.lasersOn = { 176: true, 190: false, 204: true };
    return;
  }
  if (name === 'alert') {
    // Spotted mid-gallery: Sari is chasing, the alarm is nearly full,
    // two relics in the bag and the Ruby still in the vault.
    state.time = 96;
    state.alarm = 82;
    state.lootTaken = [true, true, false];
    state.lootCount = 2;
    state.player = { x: 640, y: 300, angle: Math.PI, sneak: false, moving: true };
    placeGuard(state, 0, 340, 470, 0.6, 'patrol');
    placeGuard(state, 1, 700, 340, Math.atan2(300 - 340, 640 - 700), 'chase');
    placeGuard(state, 2, 512, 260, Math.PI / 2, 'suspect');
    state.cameras[0].angle = Math.PI / 2 + 0.6;
    state.cameras[1].angle = Math.PI / 2 - 0.2;
    state.lasersOn = { 176: true, 190: true, 204: false };
    return;
  }
  if (name === 'vault') {
    // All three relics lifted, lasers dark, the green ESCAPE door open
    // and the thief on the carpet home.
    state.time = 151;
    state.alarm = 12;
    state.lootTaken = [true, true, true];
    state.lootCount = 3;
    state.player = { x: 512, y: 600, angle: Math.PI / 2, sneak: false, moving: true };
    placeGuard(state, 0, 150, 180, Math.PI, 'patrol');
    placeGuard(state, 1, 874, 520, -Math.PI / 2, 'patrol');
    placeGuard(state, 2, 380, 430, Math.PI, 'patrol');
    state.cameras[0].angle = Math.PI / 2 - 0.8;
    state.cameras[1].angle = Math.PI / 2 + 0.8;
    state.lasersOn = { 176: false, 190: false, 204: false };
    return;
  }
  // Unknown shot name: plain mid-game frame.
  state.time = 30;
  state.alarm = 10;
}
