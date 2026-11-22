// world.js — the museum room: walls, cover, loot, guards, cameras, lasers.
// Geometry helpers: line-of-sight and circle-vs-rectangle collision.
// Nothing here is copied from any other game; the room is drawn for one
// readable frame: loot left, right and top, guards left/right/centre.

import { ROOM } from './config.js';

export const WALLS = [
  // Border walls (top, bottom, left, right).
  { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: 12 },
  { x: ROOM.x, y: ROOM.y + ROOM.h - 12, w: ROOM.w, h: 12 },
  { x: ROOM.x, y: ROOM.y, w: 12, h: ROOM.h },
  { x: ROOM.x + ROOM.w - 12, y: ROOM.y, w: 12, h: ROOM.h },
  // Interior gallery dividers.
  { x: 330, y: 210, w: 12, h: 210 },
  { x: 682, y: 210, w: 12, h: 210 },
  { x: 420, y: 470, w: 184, h: 12 },
];

// Display pedestals: solid cover that blocks movement and line of sight.
export const PEDESTALS = [
  { x: 168, y: 168, w: 54, h: 54 },
  { x: 802, y: 168, w: 54, h: 54 },
  { x: 168, y: 500, w: 54, h: 54 },
  { x: 802, y: 500, w: 54, h: 54 },
  { x: 452, y: 300, w: 60, h: 46 },
  { x: 452, y: 520, w: 60, h: 46 },
];

// Dark shadow patches: hiding here makes the thief harder to spot.
export const SHADOWS = [
  { x: 96, y: 330, w: 150, h: 110 },
  { x: 778, y: 330, w: 150, h: 110 },
];

// Loot on small plinths (walk up and take them; they do not block movement).
export const LOOT = [
  { id: 0, name: 'Golden Kris', color: '#f2c14e', x: 196, y: 252, glyph: '🗡' },
  { id: 1, name: 'Jade Mask', color: '#3fd08a', x: 828, y: 252, glyph: '🎭' },
  { id: 2, name: 'Ruby of Kencana', color: '#ff4d6d', x: 512, y: 122, glyph: '💎' },
];

// The vault nook at the top centre holds the Ruby, guarded by lasers.
export const VAULT = { x: 420, y: 88, w: 184, h: 84 };

// Laser gate across the vault mouth: three beams, blinking out of phase.
export const LASERS = [
  { y: 176, x0: 400, x1: 624, period: 2.4, on: 1.5, phase: 0.0 },
  { y: 190, x0: 400, x1: 624, period: 2.4, on: 1.5, phase: 0.8 },
  { y: 204, x0: 400, x1: 624, period: 2.4, on: 1.5, phase: 1.6 },
];

export const CAMERAS = [
  { id: 0, x: 300, y: 92, base: Math.PI / 2, sweep: 0.85, speed: 0.55, phase: 0 },
  { id: 1, x: 724, y: 92, base: Math.PI / 2, sweep: 0.85, speed: 0.55, phase: 1.9 },
];

export const GUARD_DEFS = [
  {
    id: 0, name: 'Bram',
    waypoints: [[150, 150], [150, 560], [300, 560], [300, 150]],
  },
  {
    id: 1, name: 'Sari',
    waypoints: [[874, 150], [874, 560], [724, 560], [724, 150]],
  },
  {
    id: 2, name: 'Dedi',
    waypoints: [[512, 250], [380, 430], [644, 430]],
  },
];

export const SPAWN = { x: 512, y: 600 };
export const EXIT = { x: 472, y: 660, w: 80, h: 36 };

// All rectangles that block sight and movement.
export function blockers() {
  return WALLS.concat(PEDESTALS);
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function pointInShadow(px, py) {
  return SHADOWS.some((r) => pointInRect(px, py, r));
}

// Does segment (x1,y1)-(x2,y2) cross any blocking rectangle?
export function segBlocked(x1, y1, x2, y2) {
  const rects = blockers();
  for (const r of rects) {
    if (segHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

function segHitsRect(x1, y1, x2, y2, r) {
  // Trivial: either endpoint inside the rect.
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([ax, ay, bx, by]) => segsCross(x1, y1, x2, y2, ax, ay, bx, by));
}

function segsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

// Distance from a point to the nearest blocking rectangle edge (for raycasts).
export function rayHit(x, y, angle, maxDist) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  let d = 0;
  const rects = blockers();
  while (d < maxDist) {
    px += dx;
    py += dy;
    d += step;
    if (px < ROOM.x || px > ROOM.x + ROOM.w || py < ROOM.y || py > ROOM.y + ROOM.h) break;
    if (rects.some((r) => pointInRect(px, py, r))) break;
  }
  return { x: px, y: py, d: Math.min(d, maxDist) };
}

// Move a circle against the blockers, axis by axis; returns the new position.
export function moveCircle(x, y, r, dx, dy) {
  const rects = blockers();
  let nx = x + dx;
  for (const rect of rects) {
    if (circleHitsRect(nx, y, r, rect)) {
      nx = dx > 0 ? rect.x - r : dx < 0 ? rect.x + rect.w + r : nx;
      if (dx === 0) nx = x;
    }
  }
  let ny = y + dy;
  for (const rect of rects) {
    if (circleHitsRect(nx, ny, r, rect)) {
      ny = dy > 0 ? rect.y - r : dy < 0 ? rect.y + rect.h + r : ny;
      if (dy === 0) ny = y;
    }
  }
  // Keep inside the room.
  nx = Math.max(ROOM.x + 12 + r, Math.min(ROOM.x + ROOM.w - 12 - r, nx));
  ny = Math.max(ROOM.y + 12 + r, Math.min(ROOM.y + ROOM.h - 12 - r, ny));
  return { x: nx, y: ny };
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const ddx = cx - nx;
  const ddy = cy - ny;
  return ddx * ddx + ddy * ddy < r * r;
}
