// Guards: patrol a waypoint loop, read the room with a vision cone, and
// escalate in four steps — patrol, suspicion, a fair 1.2 s grace with a red
// "!", then the chase. Lose the thief and they search the last seen spot
// before walking back to their route.

import { GUARD } from './tune.js';
import { angleDiff, angleTo, blocked, clamp, dist, moveCircle } from './collide.js';

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.wp = 0;
    this.x = def.waypoints[0][0];
    this.y = def.waypoints[0][1];
    this.dir = 0;
    this.mode = 'patrol'; // patrol | grace | chase | search | return
    this.suspicion = 0;
    this.graceLeft = 0;
    this.lastSeen = null; // { x, y }
    this.lostFor = 0;
    this.searchLeft = 0;
    this.seesThief = false;
  }

  reset() {
    this.wp = 0;
    this.x = this.waypoints[0][0];
    this.y = this.waypoints[0][1];
    this.mode = 'patrol';
    this.suspicion = 0;
    this.graceLeft = 0;
    this.lastSeen = null;
    this.lostFor = 0;
    this.searchLeft = 0;
    this.seesThief = false;
  }

  /** Can this guard see the thief right now? Smoke and vents blind it. */
  canSee(thief, solids, smokes) {
    if (thief.venting > 0) return false;
    for (const s of smokes) {
      if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.r) return false;
    }
    const range = thief.sneaking ? GUARD.sightSneak : GUARD.sight;
    const d = dist(this.x, this.y, thief.x, thief.y);
    if (d > range) return false;
    if (angleDiff(angleTo(this.x, this.y, thief.x, thief.y), this.dir) > GUARD.halfAngle) return false;
    if (blocked(this.x, this.y, thief.x, thief.y, solids)) return false;
    return true;
  }

  step(dt, thief, solids, smokes) {
    this.seesThief = this.canSee(thief, solids, smokes);
    const d = dist(this.x, this.y, thief.x, thief.y);

    if (this.mode === 'patrol' || this.mode === 'return') {
      if (this.seesThief) {
        const rate = thief.sneaking ? GUARD.fillSneak : GUARD.fillWalk;
        this.suspicion += rate * (d < 110 ? GUARD.fillClose : 1) * dt;
        if (this.suspicion >= 1) {
          this.mode = 'grace';
          this.graceLeft = GUARD.grace;
          this.lastSeen = { x: thief.x, y: thief.y };
        }
      } else {
        this.suspicion = Math.max(0, this.suspicion - GUARD.drain * dt);
      }
      this.walkRoute(dt, solids);
      return;
    }

    if (this.mode === 'grace') {
      this.dir = angleTo(this.x, this.y, thief.x, thief.y);
      this.graceLeft -= dt;
      if (this.graceLeft <= 0) this.mode = 'chase';
      return;
    }

    if (this.mode === 'chase') {
      if (this.seesThief) {
        this.lastSeen = { x: thief.x, y: thief.y };
        this.lostFor = 0;
      } else {
        this.lostFor += dt;
        if (this.lostFor >= GUARD.loseTime) {
          this.mode = 'search';
          this.searchLeft = GUARD.searchTime;
        }
      }
      const target = this.lastSeen ?? { x: thief.x, y: thief.y };
      this.dir = angleTo(this.x, this.y, target.x, target.y);
      const next = moveCircle(this.x, this.y, GUARD.radius, Math.cos(this.dir) * GUARD.chaseSpeed * dt, Math.sin(this.dir) * GUARD.chaseSpeed * dt, solids);
      this.x = clamp(next.x, GUARD.radius, 1200 - GUARD.radius);
      this.y = clamp(next.y, GUARD.radius, 600 - GUARD.radius);
      return;
    }

    if (this.mode === 'search') {
      this.searchLeft -= dt;
      if (this.seesThief) {
        this.suspicion = 1;
        this.mode = 'grace';
        this.graceLeft = GUARD.grace;
        return;
      }
      // Sweep: turn slowly where the thief was last seen.
      this.dir += dt * 1.1;
      if (this.searchLeft <= 0) this.mode = 'return';
      return;
    }
  }

  /** Walk the waypoint loop (patrol) or back to the nearest point (return). */
  walkRoute(dt, solids) {
    let target;
    if (this.mode === 'return') {
      let best = 0;
      let bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = dist(this.x, this.y, w[0], w[1]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      this.wp = best;
      target = this.waypoints[this.wp];
      if (bestD < 6) this.mode = 'patrol';
    } else {
      target = this.waypoints[this.wp];
    }
    const d = dist(this.x, this.y, target[0], target[1]);
    const speed = this.mode === 'return' ? GUARD.returnSpeed : GUARD.patrolSpeed;
    if (d < 8) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      return;
    }
    this.dir = angleTo(this.x, this.y, target[0], target[1]);
    const next = moveCircle(this.x, this.y, GUARD.radius, Math.cos(this.dir) * speed * dt, Math.sin(this.dir) * speed * dt, solids);
    this.x = clamp(next.x, GUARD.radius, 1200 - GUARD.radius);
    this.y = clamp(next.y, GUARD.radius, 600 - GUARD.radius);
  }

  get alerted() {
    return this.mode === 'grace' || this.mode === 'chase' || this.mode === 'search';
  }
}
