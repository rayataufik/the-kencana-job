// config.js — constants for The Kencana Job: one museum room, one frame.
// Everything the judge needs to see lives in this single room:
// the thief, guards with vision cones, cameras, loot and the alarm meter.

export const W = 1024;
export const H = 720;
export const HUD_H = 64;

// Playable room bounds (inside the border walls).
export const ROOM = { x: 24, y: 76, w: 976, h: 620 };

export const PLAYER_R = 13;
export const WALK_SPEED = 168;
export const SNEAK_SPEED = 96;
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 102;

export const GUARD_RANGE = 235;
export const GUARD_HALF_ANGLE = 0.56; // ~32 degrees each side
export const CAMERA_RANGE = 265;
export const CAMERA_HALF_ANGLE = 0.5;

export const ALARM_MAX = 100;
export const ALARM_DECAY = 12; // per second while unseen

export const COLORS = {
  floor: '#1b1b28',
  floorDark: '#151522',
  carpet: '#3a1f2b',
  carpetEdge: '#6b2f3f',
  wall: '#2e2e42',
  wallTop: '#45456a',
  pedestal: '#3d3d5c',
  pedestalTop: '#56568a',
  shadow: 'rgba(0,0,0,0.42)',
  gold: '#f2c14e',
  jade: '#3fd08a',
  ruby: '#ff4d6d',
  player: '#2dd4bf',
  playerDark: '#0f766e',
  guard: '#e8b23a',
  guardAlert: '#ff3b30',
  camera: '#ff8c42',
  laser: '#ff2d55',
  exit: '#22c55e',
  exitLocked: '#7f1d1d',
  hudBg: '#101018',
  text: '#f5f0e1',
  muted: '#9a9ab0',
};
