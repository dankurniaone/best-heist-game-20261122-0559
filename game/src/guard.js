// Museum guards: they walk a waypoint loop, pause at each stop, and watch a
// vision cone. Spotting the thief fills suspicion; a full bar gives the thief
// a fair warning ("!" plus a grace second) before the guard gives chase.
// A chasing guard who loses sight for a few seconds walks back to patrol.

import { GUARD } from './config.js';
import { angleDiff, dist, hasLineOfSight, inSmoke, resolveCircleRect } from './geom.js';

export function createGuard(def) {
  const start = def.waypoints[0];
  return {
    waypoints: def.waypoints,
    pause: def.pause || 1,
    x: start.x,
    y: start.y,
    dir: 0,
    targetIndex: 1 % def.waypoints.length,
    pauseTimer: 0,
    suspicion: 0,
    state: 'patrol', // 'patrol' | 'warn' | 'chase'
    graceTimer: 0,
    loseTimer: 0,
    lastSeen: { x: start.x, y: start.y },
    warned: false,
    speed: GUARD.patrolSpeed,
  };
}

/** Can this guard see the thief right now? Cones, walls and smoke all matter. */
export function guardSees(guard, player, spotRange, walls, clouds) {
  const d = dist(guard.x, guard.y, player.x, player.y);
  if (d > spotRange) return false;
  const toPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
  if (Math.abs(angleDiff(toPlayer, guard.dir)) > GUARD.viewAngle) return false;
  if (inSmoke(player.x, player.y, clouds)) return false;
  if (inSmoke(guard.x, guard.y, clouds)) return false;
  return hasLineOfSight(guard.x, guard.y, player.x, player.y, walls);
}

export function updateGuard(guard, player, spotRange, walls, clouds, dt) {
  const sees = guardSees(guard, player, spotRange, walls, clouds);
  let justWarned = false;

  if (guard.state === 'chase') {
    if (sees) {
      guard.loseTimer = 0;
      guard.lastSeen = { x: player.x, y: player.y };
    } else {
      guard.loseTimer += dt;
      if (guard.loseTimer >= GUARD.loseSeconds) {
        guard.state = 'patrol';
        guard.suspicion = 0.4;
        guard.loseTimer = 0;
        guard.warned = false;
      }
    }
    // Run to the thief's last seen spot, never through walls; on arrival,
    // look around. The guard never homes in on a thief it cannot see.
    const lx = guard.lastSeen.x; const ly = guard.lastSeen.y;
    const d = dist(guard.x, guard.y, lx, ly);
    if (d > 6) {
      const step = Math.min(GUARD.chaseSpeed * dt, d);
      const nx = guard.x + ((lx - guard.x) / d) * step;
      const ny = guard.y + ((ly - guard.y) / d) * step;
      guard.dir = Math.atan2(ly - guard.y, lx - guard.x);
      let pos = { x: nx, y: ny };
      for (const w of walls) {
        const r = resolveCircleRect(pos.x, pos.y, 14, w);
        pos = { x: r.x, y: r.y };
      }
      guard.x = pos.x;
      guard.y = pos.y;
    } else if (!sees) {
      guard.dir += dt * 1.8; // scan the room
    }
    return { sees, caught: dist(guard.x, guard.y, player.x, player.y) <= 26 };
  }

  if (sees) {
    guard.suspicion += GUARD.suspicionRate * dt;
    if (guard.suspicion >= 1 && guard.state !== 'warn') {
      guard.state = 'warn';
      guard.graceTimer = GUARD.graceSeconds;
      guard.warned = true;
      justWarned = true;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
  }

  if (guard.state === 'warn') {
    guard.graceTimer -= dt;
    // The guard turns to face the thief during the warning — the fair moment.
    guard.dir = Math.atan2(player.y - guard.y, player.x - guard.x);
    if (guard.graceTimer <= 0) {
      guard.state = 'chase';
      guard.loseTimer = 0;
      guard.lastSeen = { x: player.x, y: player.y };
    }
    return { sees, caught: false, warned: justWarned };
  }

  // Patrol: walk to the next waypoint, pause, turn to the next one.
  if (guard.pauseTimer > 0) {
    guard.pauseTimer -= dt;
    if (guard.pauseTimer <= 0) {
      guard.targetIndex = (guard.targetIndex + 1) % guard.waypoints.length;
    }
    return { sees, caught: false };
  }
  const target = guard.waypoints[guard.targetIndex];
  const d = dist(guard.x, guard.y, target.x, target.y);
  if (d < 4) {
    guard.pauseTimer = guard.pause;
    return { sees, caught: false };
  }
  const step = Math.min(GUARD.patrolSpeed * dt, d);
  guard.x += ((target.x - guard.x) / d) * step;
  guard.y += ((target.y - guard.y) / d) * step;
  guard.dir = Math.atan2(target.y - guard.y, target.x - guard.x);
  return { sees, caught: false };
}
