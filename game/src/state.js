// The run itself: screens, rooms, loot, lives, tools and the score.
// One Game owns the thief, the guards, the cameras and the alarm of the
// room it is in, and walks the player from the title to the getaway.

import { ALARM, GHOST_BONUS, LIVES, THIEF, TOOLS, TOTAL_LOOT, WORLD } from './tune.js';
import { ROOMS, roomSolids } from './rooms.js';
import { Thief } from './thief.js';
import { Guard } from './patrol.js';
import { Alarm, Camera, LaserGrid } from './devices.js';
import { dist, insideRect } from './collide.js';

export class Game {
  constructor() {
    this.screen = 'title'; // title | playing | caught | roomclear | gameover | end
    this.paused = false;
    this.roomIndex = 0;
    this.thief = new Thief(ROOMS[0].entry);
    this.guards = [];
    this.cameras = [];
    this.lasers = new LaserGrid([]);
    this.alarm = new Alarm(0);
    this.smokes = [];
    this.loot = 0;
    this.taken = new Set();
    this.vaultOpen = false;
    this.diamondTaken = false;
    this.lives = LIVES;
    this.smokeLeft = TOOLS.smokePerRoom;
    this.empLeft = TOOLS.empPerRun;
    this.time = 0;
    this.roomTime = 0;
    this.roomResults = [];
    this.peakAlarm = 0;
    this.toast = ROOMS[0].hint;
    this.toastT = 6;
    this.overlayT = 0;
    this.bestTake = 0;
    this.loadRoom(0);
  }

  get room() {
    return ROOMS[this.roomIndex];
  }

  get solids() {
    return roomSolids(this.room);
  }

  loadRoom(i) {
    this.roomIndex = i;
    const room = ROOMS[i];
    this.thief.reset(room.entry);
    this.guards = room.guards.map((g) => new Guard(g));
    this.cameras = room.cameras.map((c) => new Camera(c));
    this.lasers = new LaserGrid(room.lasers);
    this.alarm.reset(room.alarmStart);
    this.smokes = [];
    this.smokeLeft = TOOLS.smokePerRoom;
    this.roomTime = 0;
    this.vaultOpen = false;
    this.diamondTaken = false;
    this.toast = room.hint;
    this.toastT = 6;
  }

  startRun() {
    this.loot = 0;
    this.taken = new Set();
    this.lives = LIVES;
    this.empLeft = TOOLS.empPerRun;
    this.time = 0;
    this.roomResults = [];
    this.peakAlarm = 0;
    this.screen = 'playing';
    this.loadRoom(0);
  }

  /** The objective line the HUD shows right now. */
  get objective() {
    if (this.roomIndex === 0) return this.diamondTaken ? 'REACH THE EXIT' : this.room.objective;
    if (this.roomIndex === 1) return this.vaultOpen ? 'REACH THE EXIT' : this.room.objective;
    return this.room.objective;
  }

  get objectiveDone() {
    if (this.roomIndex === 0) return this.diamondTaken;
    if (this.roomIndex === 1) return this.vaultOpen;
    return true;
  }

  /** Nearest thing E can work on, within reach. */
  nearestUsable() {
    const t = this.thief;
    for (const l of this.room.loot) {
      if (this.taken.has(l.id)) continue;
      if (dist(t.x, t.y, l.x, l.y) <= THIEF.grabReach) {
        return { kind: l.kind === 'diamond' ? 'diamond' : 'grab', target: l, need: l.kind === 'diamond' ? THIEF.diamondTime : THIEF.grabTime };
      }
    }
    const v = this.room.vault;
    if (v && !this.vaultOpen) {
      const cx = Math.max(v.x, Math.min(t.x, v.x + v.w));
      const cy = Math.max(v.y, Math.min(t.y, v.y + v.h));
      if (dist(t.x, t.y, cx, cy) <= THIEF.grabReach + 22) {
        return { kind: 'vault', target: v, need: THIEF.vaultTime };
      }
    }
    for (const vent of this.room.vents) {
      if (dist(t.x, t.y, vent.x, vent.y) <= 44) {
        return { kind: 'vent', target: vent, need: THIEF.ventTime };
      }
    }
    return null;
  }

  finishAction(done) {
    const t = this.thief;
    if (done.kind === 'grab' || done.kind === 'diamond') {
      const l = done.target;
      this.taken.add(l.id);
      this.loot += l.value;
      if (l.kind === 'diamond') {
        this.diamondTaken = true;
        this.toast = 'The Star is yours — reach the service door.';
        this.toastT = 4;
      }
      return 'pickup';
    }
    if (done.kind === 'vault') {
      this.vaultOpen = true;
      this.loot += this.room.vault.gold;
      this.toast = 'Vault open — $26,000 in gold. Reach the service door.';
      this.toastT = 4;
      return 'vault';
    }
    if (done.kind === 'vent') {
      const other = this.room.vents[done.target.pair];
      t.ventFrom = done.target;
      t.venting = THIEF.ventTime;
      t.x = other.x;
      t.y = other.y;
      return 'vent';
    }
    return null;
  }

  throwSmoke(at) {
    if (this.smokeLeft <= 0) return false;
    this.smokeLeft -= 1;
    this.smokes.push({ x: at.x, y: at.y, r: 92, left: TOOLS.smokeLife });
    return true;
  }

  empBurst() {
    if (this.empLeft <= 0) return false;
    this.empLeft -= 1;
    for (const c of this.cameras) c.blindLeft = 8;
    this.toast = 'EMP burst — every camera blind for 8 seconds.';
    this.toastT = 3;
    return true;
  }

  caught() {
    this.lives -= 1;
    this.thief.cancelAction();
    if (this.lives <= 0) {
      this.screen = 'gameover';
      this.overlayT = 0;
      return 'gameover';
    }
    this.screen = 'caught';
    this.overlayT = 1.6;
    return 'caught';
  }

  respawn() {
    this.thief.reset(this.room.entry);
    for (const g of this.guards) g.reset();
    for (const c of this.cameras) c.reset();
    this.alarm.value = ALARM.caughtReset;
    this.smokes = [];
    this.screen = 'playing';
    this.toast = 'Caught. One life gone — the room resets, the loot stays yours.';
    this.toastT = 4;
  }

  clearRoom() {
    const bonus = Math.min(5000, Math.max(0, Math.round((this.room.par - this.roomTime) * 50)));
    const roomLoot = this.loot - this.roomResults.reduce((s, r) => s + r.loot, 0);
    this.roomResults.push({ name: this.room.name, loot: roomLoot, time: this.roomTime, bonus });
    if (this.roomIndex >= ROOMS.length - 1) {
      this.screen = 'end';
      this.overlayT = 0;
      return;
    }
    this.screen = 'roomclear';
    this.overlayT = 2.2;
    this.clearBonus = bonus;
  }

  nextRoom() {
    this.loadRoom(this.roomIndex + 1);
    this.screen = 'playing';
  }

  get timeBonus() {
    return this.roomResults.reduce((s, r) => s + r.bonus, 0);
  }

  get ghost() {
    return this.peakAlarm <= 25;
  }

  get finalTake() {
    return this.loot + this.timeBonus + (this.ghost ? GHOST_BONUS : 0);
  }

  get rating() {
    if (this.peakAlarm <= 25) return 'GHOST';
    if (this.peakAlarm <= 60) return 'PROFESSIONAL';
    return 'SMASH-AND-GRAB';
  }

  /** One fixed step of the run. `input` is the keyboard/mouse state. */
  step(dt, input) {
    if (this.toastT > 0) this.toastT -= dt;

    if (this.screen === 'caught') {
      this.overlayT -= dt;
      if (this.overlayT <= 0) this.respawn();
      return;
    }
    if (this.screen === 'roomclear') {
      this.overlayT -= dt;
      if (this.overlayT <= 0) this.nextRoom();
      return;
    }
    if (this.screen !== 'playing' || this.paused) return;

    this.time += dt;
    this.roomTime += dt;

    // Vent crawl finishes where the paired grate is.
    if (this.thief.venting > 0) {
      this.thief.step(dt, input, this.solids);
      if (this.thief.venting <= 0) this.thief.cancelAction();
    } else {
      this.thief.step(dt, input, this.solids);
    }

    // E: start an action on press, advance it while held and near.
    if (input.pressed('KeyE')) {
      const use = this.nearestUsable();
      if (use) this.thief.startAction(use.kind, use.target, use.need);
    }
    if (this.thief.action) {
      const a = this.thief.action;
      let near = true;
      if (a.kind === 'grab' || a.kind === 'diamond') {
        near = dist(this.thief.x, this.thief.y, a.target.x, a.target.y) <= THIEF.grabReach + 12;
      } else if (a.kind === 'vault') {
        const v = this.room.vault;
        const cx = Math.max(v.x, Math.min(this.thief.x, v.x + v.w));
        const cy = Math.max(v.y, Math.min(this.thief.y, v.y + v.h));
        near = dist(this.thief.x, this.thief.y, cx, cy) <= THIEF.grabReach + 34;
      } else if (a.kind === 'vent') {
        near = dist(this.thief.x, this.thief.y, a.target.x, a.target.y) <= 56;
      }
      const held = input.held('KeyE');
      const result = this.thief.advanceAction(dt, near && held);
      if (result && result !== 'busy' && result !== 'broke') this.finishAction(result);
    }

    if (input.pressed('KeyQ')) this.throwSmoke(input.smokeTarget(this.thief));
    if (input.pressed('KeyR')) this.empBurst();
    if (input.clicked()) this.throwSmoke(input.clickTarget(this.thief));

    for (const s of this.smokes) s.left -= dt;
    this.smokes = this.smokes.filter((s) => s.left > 0);

    let seenByGuard = false;
    let seenByCamera = false;
    for (const g of this.guards) {
      g.step(dt, this.thief, this.solids, this.smokes);
      if (g.seesThief) seenByGuard = true;
    }
    for (const c of this.cameras) {
      c.step(dt, this.thief, this.solids, this.smokes);
      if (c.seesThief) seenByCamera = true;
    }
    this.lasers.step(dt);
    if (this.lasers.trips(this.thief)) {
      this.alarm.fine(12);
      this.toast = 'Laser trip — the alarm jumps.';
      this.toastT = 2.5;
    }
    this.alarm.step(dt, seenByGuard, seenByCamera);
    if (this.alarm.value > this.peakAlarm) this.peakAlarm = this.alarm.value;

    // Caught: a chasing guard touches the thief, or the alarm locks down.
    for (const g of this.guards) {
      if (g.mode === 'chase' && dist(g.x, g.y, this.thief.x, this.thief.y) < 27) {
        this.caught();
        return;
      }
    }
    if (this.alarm.lockedDown) {
      this.toast = 'Lockdown — the museum seals itself.';
      this.caught();
      return;
    }

    // The exit opens once the room's job is done.
    const exit = this.room.exit;
    if (this.objectiveDone && insideRect(this.thief.x, this.thief.y, exit)) {
      this.clearRoom();
    }
  }

  /** Total loot available across the run, for the HUD. */
  static totalLoot() {
    return TOTAL_LOOT;
  }

  static world() {
    return WORLD;
  }
}
