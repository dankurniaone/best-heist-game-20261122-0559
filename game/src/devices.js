// The room's devices: cameras that sweep red cones, lasers that slide a
// gap along each beam, and the alarm meter they all feed. A camera that
// sees the thief raises the alarm; an EMP burst blinds every camera for
// eight seconds; a laser trip is a flat fine, paid at once.

import { ALARM, CAMERA, LASER } from './tune.js';
import { angleDiff, angleTo, blocked, dist } from './collide.js';

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.base = def.base;
    this.sweep = def.sweep;
    this.period = def.period;
    this.t = Math.random() * def.period;
    this.dir = def.base;
    this.blindLeft = 0;
    this.seesThief = false;
  }

  reset() {
    this.t = 0;
    this.dir = this.base;
    this.blindLeft = 0;
    this.seesThief = false;
  }

  step(dt, thief, solids, smokes) {
    this.t += dt;
    const phase = (this.t % this.period) / this.period;
    this.dir = this.base + Math.sin(phase * Math.PI * 2) * this.sweep;
    if (this.blindLeft > 0) {
      this.blindLeft -= dt;
      this.seesThief = false;
      return;
    }
    if (thief.venting > 0) {
      this.seesThief = false;
      return;
    }
    for (const s of smokes) {
      if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.r) {
        this.seesThief = false;
        return;
      }
    }
    const d = dist(this.x, this.y, thief.x, thief.y);
    this.seesThief =
      d <= CAMERA.range &&
      angleDiff(angleTo(this.x, this.y, thief.x, thief.y), this.dir) <= CAMERA.halfAngle &&
      !blocked(this.x, this.y, thief.x, thief.y, solids);
  }
}

export class LaserGrid {
  constructor(defs) {
    this.beams = defs.map((d) => ({ ...d, tripped: false }));
  }

  reset() {
    for (const b of this.beams) {
      b.gap = b.gap;
      b.tripped = false;
    }
  }

  step(dt) {
    for (const b of this.beams) {
      b.gap += b.speed * dt;
      const lo = b.x0 + b.gapW / 2;
      const hi = b.x1 - b.gapW / 2;
      if (b.gap < lo) {
        b.gap = lo;
        b.speed = Math.abs(b.speed);
      }
      if (b.gap > hi) {
        b.gap = hi;
        b.speed = -Math.abs(b.speed);
      }
    }
  }

  /** The thief crosses a live beam outside its gap: true, once per crossing. */
  trips(thief) {
    for (const b of this.beams) {
      const onBeam = Math.abs(thief.y - b.y) < LASER.width / 2 + thief.r;
      const inGap = Math.abs(thief.x - b.gap) < b.gapW / 2;
      if (onBeam && !inGap && !b.tripped) {
        b.tripped = true;
        return true;
      }
      if (!onBeam) b.tripped = false;
    }
    return false;
  }
}

export class Alarm {
  constructor(start = 0) {
    this.value = start;
    this.peak = start;
  }

  reset(start = 0) {
    this.value = start;
    this.peak = start;
  }

  /** One step: rise while seen, bleed off in the dark. */
  step(dt, seenByGuard, seenByCamera) {
    let rise = 0;
    if (seenByGuard) rise += ALARM.guardPerSecond;
    if (seenByCamera) rise += ALARM.cameraPerSecond;
    if (rise > 0) this.value += rise * dt;
    else this.value -= ALARM.decayPerSecond * dt;
    if (this.value < 0) this.value = 0;
    if (this.value > 100) this.value = 100;
    if (this.value > this.peak) this.peak = this.value;
  }

  fine(amount) {
    this.value = Math.min(100, this.value + amount);
    if (this.value > this.peak) this.peak = this.value;
  }

  get lockedDown() {
    return this.value >= 100;
  }
}
