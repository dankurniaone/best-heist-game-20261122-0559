// The thief: Rook. Moves with WASD or arrows, Shift to sneak, and collides with
// walls as a circle. Stance is the stealth core: sneaking is slow but hard to
// spot, running is fast but loud and easy to see.

import { PLAYER, ROOM, WALL } from './config.js';
import { clamp, resolveCircleRect } from './geom.js';

export function createPlayer(x, y) {
  return {
    x, y,
    radius: PLAYER.radius,
    face: -Math.PI / 2, // facing up at the start
    stance: 'walk', // 'sneak' | 'walk' | 'run'
    moving: false,
    // Interaction progress (0..1) while holding E on something.
    interactTarget: null,
    interactProgress: 0,
  };
}

/** Move the thief one step; walls and the room bounds stop them. */
export function movePlayer(player, axis, dt, walls) {
  const running = axis.x !== 0 || axis.y !== 0;
  player.moving = running;
  if (!running) return;
  const speed = player.stance === 'sneak'
    ? PLAYER.sneakSpeed
    : player.stance === 'run'
      ? PLAYER.runSpeed
      : PLAYER.walkSpeed;
  player.face = Math.atan2(axis.y, axis.x);
  const nx = player.x + axis.x * speed * dt;
  const ny = player.y + axis.y * speed * dt;
  // Move one axis at a time so the thief slides along walls instead of sticking.
  let pos = { x: nx, y: player.y };
  for (const w of walls) {
    const r = resolveCircleRect(pos.x, pos.y, player.radius, w);
    pos = { x: r.x, y: r.y };
  }
  pos.x = clamp(pos.x, ROOM.x + WALL + player.radius, ROOM.x + ROOM.width - WALL - player.radius);
  pos.y = clamp(pos.y, ROOM.y + WALL + player.radius, ROOM.y + ROOM.height - WALL - player.radius);
  player.x = pos.x;
  pos = { x: player.x, y: ny };
  for (const w of walls) {
    const r = resolveCircleRect(pos.x, pos.y, player.radius, w);
    pos = { x: r.x, y: r.y };
  }
  pos.x = clamp(pos.x, ROOM.x + WALL + player.radius, ROOM.x + ROOM.width - WALL - player.radius);
  pos.y = clamp(pos.y, ROOM.y + WALL + player.radius, ROOM.y + ROOM.height - WALL - player.radius);
  player.y = pos.y;
}

/** How easy the thief is to spot right now (multiplies guard view range). */
export function spotFactor(player) {
  if (player.stance === 'sneak') return PLAYER.sneakSpot;
  if (player.stance === 'run') return PLAYER.runSpot;
  return PLAYER.walkSpot;
}
