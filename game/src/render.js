// render.js — draws one frame of The Kencana Job.
// The whole heist must read in a single frame: thief, guard cones, camera
// cones, loot, lasers, exit and the alarm meter, all on screen at once.

import { W, H, HUD_H, ROOM, COLORS } from './config.js';
import { WALLS, PEDESTALS, SHADOWS, LOOT, VAULT, LASERS, CAMERAS, EXIT, rayHit } from './world.js';

function conePolygon(x, y, angle, halfAngle, range) {
  const pts = [{ x, y }];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const hit = rayHit(x, y, a, range);
    pts.push({ x: hit.x, y: hit.y });
  }
  return pts;
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  const pts = conePolygon(x, y, angle, halfAngle, range);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

export function draw(ctx, state) {
  const t = state.time;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, W, H);

  drawRoom(ctx, state, t);
  drawLasers(ctx, state);
  drawLoot(ctx, state);
  drawExit(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  drawHud(ctx, state);

  if (state.mode === 'title') drawTitle(ctx);
  else if (state.mode === 'caught') drawCaught(ctx, state);
  else if (state.mode === 'win') drawWin(ctx, state);
}

function drawRoom(ctx, state, t) {
  // Floor tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.fillStyle = COLORS.floorDark;
  const ts = 62;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += ts) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += ts) {
      const even = ((x - ROOM.x) / ts + (y - ROOM.y) / ts) % 2 === 0;
      if (even) ctx.fillRect(x, y, ts, ts);
    }
  }
  // Red carpet from the door to the vault.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(472, ROOM.y + 12, 80, ROOM.h - 24);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(472, ROOM.y + 12, 80, ROOM.h - 24);

  // Vault nook.
  ctx.fillStyle = '#241a10';
  ctx.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', VAULT.x + VAULT.w / 2, VAULT.y + 18);

  // Shadow patches.
  for (const s of SHADOWS) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120,120,160,0.35)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,200,230,0.55)';
    ctx.font = '11px sans-serif';
    ctx.fillText('SHADOW', s.x + s.w / 2, s.y + 16);
  }

  // Walls.
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }

  // Pedestals.
  for (const p of PEDESTALS) {
    ctx.fillStyle = COLORS.pedestal;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = COLORS.pedestalTop;
    ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
    ctx.strokeStyle = 'rgba(242,193,78,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
  }
}

function drawLasers(ctx, state) {
  for (const l of LASERS) {
    const on = state.lasersOn[l.y] !== false;
    if (on) {
      ctx.strokeStyle = COLORS.laser;
      ctx.lineWidth = 3;
      ctx.shadowColor = COLORS.laser;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(l.x0, l.y);
      ctx.lineTo(l.x1, l.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.laser;
      ctx.beginPath();
      ctx.arc(l.x0, l.y, 4, 0, Math.PI * 2);
      ctx.arc(l.x1, l.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,45,85,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(l.x0, l.y);
      ctx.lineTo(l.x1, l.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.fillStyle = 'rgba(255,45,85,0.8)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LASERS', 636, 182);
}

function drawLoot(ctx, state) {
  for (const item of LOOT) {
    if (state.lootTaken[item.id]) continue;
    const pulse = 1 + 0.12 * Math.sin(state.time * 3 + item.id * 2);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆', 0, 4);
    ctx.restore();
    ctx.fillStyle = item.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, item.y + 30);
  }
}

function drawExit(ctx, state) {
  const open = state.lootCount >= 3;
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = open ? '#a7f3d0' : '#fca5a5';
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'ESCAPE ▼' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + 23);
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    const def = CAMERAS[cam.id];
    drawCone(ctx, cam.x, cam.y, cam.angle, 0.5, 265, 'rgba(255,140,66,0.13)', 'rgba(255,140,66,0.4)');
    ctx.fillStyle = '#222';
    ctx.strokeStyle = COLORS.camera;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
    ctx.stroke();
    ctx.fillStyle = COLORS.camera;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAM', cam.x, cam.y - 14);
    void def;
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    const alert = g.state !== 'patrol';
    const col = g.state === 'chase' ? COLORS.guardAlert : COLORS.guard;
    const fill = g.state === 'chase' ? 'rgba(255,59,48,0.26)' : 'rgba(232,178,58,0.16)';
    const edge = g.state === 'chase' ? 'rgba(255,59,48,0.55)' : 'rgba(232,178,58,0.4)';
    drawCone(ctx, g.x, g.y, g.angle, 0.56, 235, fill, edge);
    // Body.
    ctx.fillStyle = '#1c1c28';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Facing tick.
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    // Eyes.
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 6 - Math.sin(g.angle) * 4, g.y + Math.sin(g.angle) * 6 + Math.cos(g.angle) * 4, 2.5, 0, Math.PI * 2);
    ctx.arc(g.x + Math.cos(g.angle) * 6 + Math.sin(g.angle) * 4, g.y + Math.sin(g.angle) * 6 - Math.cos(g.angle) * 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - 22);
    if (alert) {
      ctx.fillStyle = COLORS.guardAlert;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('!', g.x + 20, g.y - 14);
    }
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  // Sneak ring.
  if (p.sneak) {
    ctx.strokeStyle = 'rgba(45,212,191,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = COLORS.playerDark;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Mask slit.
  ctx.strokeStyle = '#0b0b12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x - 7, p.y - 2);
  ctx.lineTo(p.x + 7, p.y - 2);
  ctx.stroke();
  // Direction tick.
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18);
  ctx.stroke();
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THIEF', p.x, p.y - 22);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.strokeStyle = '#2a2a3d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(W, HUD_H);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('THE KENCANA JOB', 20, 27);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText('midnight museum heist — grab all 3 relics, reach the green door', 20, 48);

  // Loot pips.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('LOOT', 512, 22);
  for (let i = 0; i < 3; i++) {
    const taken = state.lootTaken[i];
    const item = LOOT[i];
    ctx.fillStyle = taken ? item.color : '#33334a';
    ctx.strokeStyle = taken ? item.color : '#55556e';
    ctx.beginPath();
    ctx.moveTo(462 + i * 52, 30);
    ctx.lineTo(474 + i * 52, 42);
    ctx.lineTo(462 + i * 52, 54);
    ctx.lineTo(450 + i * 52, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${state.lootCount} / 3`, 512, 58 - 2);

  // Alarm meter.
  const ax = 760;
  const ay = 8;
  const aw = 210;
  const ah = 14;
  ctx.textAlign = 'left';
  ctx.fillStyle = state.alarm >= 70 ? '#ff6b60' : COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, ay + 13);
  ctx.fillStyle = '#262638';
  ctx.fillRect(ax, ay + 20, aw, ah);
  const frac = Math.max(0, Math.min(1, state.alarm / 100));
  ctx.fillStyle = frac < 0.45 ? '#22c55e' : frac < 0.75 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(ax, ay + 20, aw * frac, ah);
  ctx.strokeStyle = '#55556e';
  ctx.strokeRect(ax, ay + 20, aw, ah);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + aw + 8, ay + 32);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText(`TIME ${fmtTime(state.time)}`, ax, 58);

  // Bottom hint.
  ctx.fillStyle = 'rgba(154,154,176,0.9)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move   ·   Shift sneak   ·   hide in shadows   ·   time the lasers   ·   R restart   ·   M mute', W / 2, H - 8);
}

function overlay(ctx, bg, title, titleColor, lines) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, W / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px sans-serif';
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 345 + i * 28));
}

function drawTitle(ctx) {
  overlay(ctx, 'rgba(8,8,16,0.82)', 'THE KENCANA JOB', COLORS.gold, [
    'One thief. One museum. Three relics before dawn.',
    'Dodge the guards’ vision cones and the sweeping cameras.',
    'Slip the laser gate, lift the Ruby of Kencana, and vanish out the green door.',
    '',
    'WASD / arrows — move      Shift — sneak (slower, harder to spot)',
    'Hide in the dark shadow patches. If the ALARM hits 100%, you are caught.',
    '',
    'Press ENTER to start the heist',
  ]);
}

function drawCaught(ctx, state) {
  overlay(ctx, 'rgba(60,8,8,0.82)', 'CAUGHT!', '#ff6b60', [
    `The alarm hit 100% — ${state.caughtReason || 'a guard spotted you'}.`,
    `You had ${state.lootCount} of 3 relics after ${fmtTime(state.time)}.`,
    '',
    'Press R to try the job again',
  ]);
}

function drawWin(ctx, state) {
  overlay(ctx, 'rgba(8,40,20,0.85)', 'CLEAN GETAWAY', COLORS.gold, [
    'All three relics — the Golden Kris, the Jade Mask, the Ruby of Kencana —',
    `are yours. You slipped out in ${fmtTime(state.winTime)} with the alarm at ${Math.round(state.alarm)}%.`,
    '',
    'Press R to run the job again',
  ]);
}
