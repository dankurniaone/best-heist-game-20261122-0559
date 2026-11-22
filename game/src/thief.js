// The thief: Rook. Moves with WASD or arrows, sneaks on Shift, and works
// the room with E. The thief is a circle that slides along walls; the rest
// of the game reads its position, its stance and what it is doing.

import { THIEF, WORLD } from './tune.js';
import { clamp, moveCircle } from './collide.js';

export class Thief {
  constructor(entry) {
    this.x = entry.x;
    this.y = entry.y;
    this.r = THIEF.radius;
    this.face = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.action = null; // { kind: 'grab'|'diamond'|'vault'|'vent', target, t, need }
    this.venting = 0; // seconds left crawling a vent, 0 when not
    this.ventFrom = null;
  }

  reset(entry) {
    this.x = entry.x;
    this.y = entry.y;
    this.face = -Math.PI / 2;
    this.action = null;
    this.venting = 0;
    this.ventFrom = null;
  }

  /** One fixed step. Returns the displacement, for the footstep sound. */
  step(dt, input, solids) {
    if (this.venting > 0) {
      this.venting -= dt;
      return 0;
    }
    let mx = 0;
    let my = 0;
    if (input.held('KeyW') || input.held('ArrowUp')) my -= 1;
    if (input.held('KeyS') || input.held('ArrowDown')) my += 1;
    if (input.held('KeyA') || input.held('ArrowLeft')) mx -= 1;
    if (input.held('KeyD') || input.held('ArrowRight')) mx += 1;
    this.sneaking = input.held('ShiftLeft') || input.held('ShiftRight');
    this.moving = mx !== 0 || my !== 0;
    if (!this.moving) return 0;
    const len = Math.hypot(mx, my);
    const speed = this.sneaking ? THIEF.sneak : THIEF.walk;
    const dx = (mx / len) * speed * dt;
    const dy = (my / len) * speed * dt;
    this.face = Math.atan2(dy, dx);
    const next = moveCircle(this.x, this.y, this.r, dx, dy, solids);
    this.x = clamp(next.x, this.r, WORLD.w - this.r);
    this.y = clamp(next.y, this.r, WORLD.h - this.r);
    return Math.hypot(dx, dy);
  }

  /** Begin an action on a target (loot, diamond, vault, vent). */
  startAction(kind, target, need) {
    this.action = { kind, target, t: 0, need };
  }

  /** Advance the current action. Returns 'done' when it finishes. */
  advanceAction(dt, stillNear) {
    if (!this.action) return null;
    if (!stillNear) {
      this.action = null;
      return 'broke';
    }
    this.action.t += dt;
    if (this.action.t >= this.action.need) {
      const done = this.action;
      this.action = null;
      return done;
    }
    return 'busy';
  }

  cancelAction() {
    this.action = null;
  }

  get busy() {
    return this.action !== null || this.venting > 0;
  }
}
