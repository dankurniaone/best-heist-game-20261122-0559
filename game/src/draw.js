// The renderer: every pixel of the Marlowe Museum. A top-down floor plan
// in navy and brass — gold for the room and the loot, amber cones for the
// guards, red cones for the cameras, and one thief in the dark between
// them. Screens (title, caught, room clear, game over, getaway) are drawn
// here too, so a screenshot holds the whole game.

import { PALETTE, WORLD } from './tune.js';
import { ROOMS } from './rooms.js';

const W = 1280;
const H = 720;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = Math.min((W - 48) / WORLD.w, (H - 92) / WORLD.h);
    this.ox = (W - WORLD.w * this.scale) / 2;
    this.oy = 64 + (H - 92 - WORLD.h * this.scale) / 2;
  }

  /** World (x, y) to screen pixels. */
  sx(x) {
    return this.ox + x * this.scale;
  }

  sy(y) {
    return this.oy + y * this.scale;
  }

  render(game) {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    c.fillStyle = PALETTE.page;
    c.fillRect(0, 0, W, H);
    this.drawFloor(game);
    this.drawExit(game);
    this.drawVents(game);
    this.drawLoot(game);
    this.drawVault(game);
    this.drawLasers(game);
    this.drawSmoke(game);
    this.drawCameras(game);
    this.drawGuards(game);
    this.drawThief(game);
    if (game.screen === 'title') this.drawTitle(game);
    if (game.screen === 'caught') this.drawCaught(game);
    if (game.screen === 'roomclear') this.drawRoomClear(game);
    if (game.screen === 'gameover') this.drawGameOver(game);
    if (game.screen === 'end') this.drawEnd(game);
    if (game.paused && game.screen === 'playing') this.drawPaused();
  }

  drawFloor(game) {
    const c = this.ctx;
    const room = game.room;
    // Checkerboard tiles, 60 units a side.
    const tile = 60;
    for (let ty = 0; ty < WORLD.h / tile; ty++) {
      for (let tx = 0; tx < WORLD.w / tile; tx++) {
        c.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        c.fillRect(this.sx(tx * tile), this.sy(ty * tile), tile * this.scale + 1, tile * this.scale + 1);
      }
    }
    // Room border, brass.
    c.strokeStyle = PALETTE.wallEdge;
    c.lineWidth = 2;
    c.strokeRect(this.sx(2), this.sy(2), WORLD.w * this.scale - 4, WORLD.h * this.scale - 4);
    // Walls and cases.
    for (const s of game.solids) {
      c.fillStyle = PALETTE.wall;
      c.fillRect(this.sx(s.x), this.sy(s.y), s.w * this.scale, s.h * this.scale);
      c.strokeStyle = 'rgba(201,162,39,0.55)';
      c.lineWidth = 1;
      c.strokeRect(this.sx(s.x), this.sy(s.y), s.w * this.scale, s.h * this.scale);
    }
    void room;
  }

  drawExit(game) {
    const c = this.ctx;
    const e = game.room.exit;
    const open = game.objectiveDone;
    c.fillStyle = open ? 'rgba(63,185,107,0.25)' : 'rgba(201,162,39,0.22)';
    c.fillRect(this.sx(e.x), this.sy(e.y), e.w * this.scale, e.h * this.scale);
    c.strokeStyle = open ? PALETTE.safe : PALETTE.gold;
    c.lineWidth = 2;
    c.strokeRect(this.sx(e.x), this.sy(e.y), e.w * this.scale, e.h * this.scale);
    c.fillStyle = open ? PALETTE.safe : PALETTE.gold;
    c.font = `600 ${Math.round(13 * this.scale)}px ui-monospace, monospace`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(open ? 'EXIT OPEN' : 'LOCKED', this.sx(e.x + e.w / 2), this.sy(e.y + e.h / 2));
    c.fillStyle = PALETTE.inkDim;
    c.font = `${Math.round(11 * this.scale)}px ui-monospace, monospace`;
    c.fillText(e.label, this.sx(e.x + e.w / 2), this.sy(e.y + e.h + 14));
  }

  drawVents(game) {
    const c = this.ctx;
    for (const v of game.room.vents) {
      const w = 26;
      const h = 64;
      c.fillStyle = '#0d1119';
      c.fillRect(this.sx(v.x - w / 2), this.sy(v.y - h / 2), w * this.scale, h * this.scale);
      c.strokeStyle = PALETTE.inkFaint;
      c.lineWidth = 1;
      c.strokeRect(this.sx(v.x - w / 2), this.sy(v.y - h / 2), w * this.scale, h * this.scale);
      c.strokeStyle = 'rgba(154,163,157,0.6)';
      for (let i = 1; i <= 4; i++) {
        const y = v.y - h / 2 + (h / 5) * i;
        c.beginPath();
        c.moveTo(this.sx(v.x - w / 2 + 4), this.sy(y));
        c.lineTo(this.sx(v.x + w / 2 - 4), this.sy(y));
        c.stroke();
      }
      c.fillStyle = PALETTE.inkDim;
      c.font = `${Math.round(10 * this.scale)}px ui-monospace, monospace`;
      c.textAlign = 'center';
      c.fillText('VENT', this.sx(v.x), this.sy(v.y - h / 2 - 8));
    }
  }

  drawLoot(game) {
    const c = this.ctx;
    for (const l of game.room.loot) {
      if (game.taken.has(l.id)) continue;
      if (l.kind === 'diamond') {
        c.save();
        c.shadowColor = '#dfe9ff';
        c.shadowBlur = 24;
        c.translate(this.sx(l.x), this.sy(l.y));
        c.rotate(Math.PI / 4);
        const s = 15 * this.scale;
        c.fillStyle = PALETTE.diamond;
        c.fillRect(-s / 2, -s / 2, s, s);
        c.restore();
        c.fillStyle = PALETTE.goldBright;
        c.font = `600 ${Math.round(12 * this.scale)}px ui-monospace, monospace`;
        c.textAlign = 'center';
        c.fillText('✦ THE STAR OF MARLOWE ✦', this.sx(l.x), this.sy(l.y + 34));
      } else if (l.kind === 'painting') {
        const w = 56;
        const h = 40;
        c.fillStyle = '#1c2438';
        c.fillRect(this.sx(l.x - w / 2), this.sy(l.y - h / 2), w * this.scale, h * this.scale);
        c.strokeStyle = PALETTE.gold;
        c.lineWidth = 2;
        c.strokeRect(this.sx(l.x - w / 2), this.sy(l.y - h / 2), w * this.scale, h * this.scale);
        c.fillStyle = '#e07840';
        c.beginPath();
        c.arc(this.sx(l.x - 10), this.sy(l.y - 4), 8 * this.scale, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#7fae6b';
        c.fillRect(this.sx(l.x + 2), this.sy(l.y - 2), 16 * this.scale, 10 * this.scale);
        c.fillStyle = PALETTE.ink;
        c.font = `${Math.round(11 * this.scale)}px ui-monospace, monospace`;
        c.textAlign = 'center';
        c.fillText(l.label, this.sx(l.x), this.sy(l.y + h / 2 + 14));
      } else if (l.kind === 'gold') {
        c.fillStyle = PALETTE.lootGold;
        const w = 30;
        const h = 14;
        c.beginPath();
        c.moveTo(this.sx(l.x - w / 2), this.sy(l.y + h / 2));
        c.lineTo(this.sx(l.x - w / 2 + 5), this.sy(l.y - h / 2));
        c.lineTo(this.sx(l.x + w / 2 - 5), this.sy(l.y - h / 2));
        c.lineTo(this.sx(l.x + w / 2), this.sy(l.y + h / 2));
        c.closePath();
        c.fill();
        c.fillStyle = PALETTE.ink;
        c.font = `${Math.round(11 * this.scale)}px ui-monospace, monospace`;
        c.textAlign = 'center';
        c.fillText(l.label, this.sx(l.x), this.sy(l.y + 26));
      }
    }
  }

  drawVault(game) {
    const c = this.ctx;
    const v = game.room.vault;
    if (!v) return;
    c.fillStyle = '#232c40';
    c.fillRect(this.sx(v.x), this.sy(v.y), v.w * this.scale, v.h * this.scale);
    c.strokeStyle = game.vaultOpen ? PALETTE.safe : PALETTE.gold;
    c.lineWidth = 2;
    c.strokeRect(this.sx(v.x), this.sy(v.y), v.w * this.scale, v.h * this.scale);
    // Dial.
    c.beginPath();
    c.arc(this.sx(v.x + v.w / 2), this.sy(v.y + v.h / 2), 26 * this.scale, 0, Math.PI * 2);
    c.strokeStyle = game.vaultOpen ? PALETTE.safe : PALETTE.goldBright;
    c.lineWidth = 3;
    c.stroke();
    c.beginPath();
    c.moveTo(this.sx(v.x + v.w / 2), this.sy(v.y + v.h / 2));
    c.lineTo(this.sx(v.x + v.w / 2 + 18), this.sy(v.y + v.h / 2 - 12));
    c.stroke();
    c.fillStyle = game.vaultOpen ? PALETTE.safe : PALETTE.gold;
    c.font = `600 ${Math.round(13 * this.scale)}px ui-monospace, monospace`;
    c.textAlign = 'center';
    c.fillText(game.vaultOpen ? 'VAULT OPEN' : 'VAULT', this.sx(v.x + v.w / 2), this.sy(v.y - 12));
    if (game.vaultOpen) {
      c.fillStyle = PALETTE.lootGold;
      c.font = `${Math.round(12 * this.scale)}px ui-monospace, monospace`;
      c.fillText('$26,000', this.sx(v.x + v.w / 2), this.sy(v.y + v.h + 16));
    }
  }

  drawLasers(game) {
    const c = this.ctx;
    for (const b of game.lasers.beams) {
      const y = this.sy(b.y);
      const x0 = this.sx(b.x0);
      const x1 = this.sx(b.x1);
      const gx0 = this.sx(b.gap - b.gapW / 2);
      const gx1 = this.sx(b.gap + b.gapW / 2);
      c.strokeStyle = PALETTE.danger;
      c.lineWidth = 2;
      c.shadowColor = PALETTE.danger;
      c.shadowBlur = 8;
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(gx0, y);
      c.moveTo(gx1, y);
      c.lineTo(x1, y);
      c.stroke();
      c.shadowBlur = 0;
      // Emitters.
      c.fillStyle = PALETTE.danger;
      c.beginPath();
      c.arc(x0, y, 4, 0, Math.PI * 2);
      c.arc(x1, y, 4, 0, Math.PI * 2);
      c.fill();
    }
  }

  drawSmoke(game) {
    const c = this.ctx;
    for (const s of game.smokes) {
      const alpha = Math.min(1, s.left / 2) * 0.55;
      const g = c.createRadialGradient(this.sx(s.x), this.sy(s.y), 4, this.sx(s.x), this.sy(s.y), s.r * this.scale);
      g.addColorStop(0, `rgba(180,190,200,${alpha})`);
      g.addColorStop(1, 'rgba(180,190,200,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(this.sx(s.x), this.sy(s.y), s.r * this.scale, 0, Math.PI * 2);
      c.fill();
    }
  }

  cone(x, y, dir, half, range, fill) {
    const c = this.ctx;
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(this.sx(x), this.sy(y));
    c.arc(this.sx(x), this.sy(y), range * this.scale, dir - half, dir + half);
    c.closePath();
    c.fill();
  }

  drawCameras(game) {
    const c = this.ctx;
    for (const cam of game.cameras) {
      const hot = cam.seesThief;
      this.cone(cam.x, cam.y, cam.dir, 0.49, 265, hot ? 'rgba(229,72,77,0.32)' : 'rgba(229,72,77,0.16)');
      c.fillStyle = cam.blindLeft > 0 ? PALETTE.inkFaint : PALETTE.danger;
      c.beginPath();
      c.arc(this.sx(cam.x), this.sy(cam.y), 9 * this.scale, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#0b0e13';
      c.beginPath();
      c.arc(this.sx(cam.x), this.sy(cam.y), 4 * this.scale, 0, Math.PI * 2);
      c.fill();
    }
  }

  drawGuards(game) {
    const c = this.ctx;
    for (const g of game.guards) {
      const hot = g.mode === 'grace' || g.mode === 'chase';
      this.cone(g.x, g.y, g.dir, 0.56, 230, hot ? 'rgba(232,201,90,0.34)' : 'rgba(232,201,90,0.18)');
      // Body.
      c.fillStyle = '#20293d';
      c.beginPath();
      c.arc(this.sx(g.x), this.sy(g.y), 14 * this.scale, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = hot ? PALETTE.danger : '#5a6a8c';
      c.lineWidth = 2;
      c.stroke();
      // Face dot toward the look direction.
      c.fillStyle = '#e8ece9';
      c.beginPath();
      c.arc(this.sx(g.x + Math.cos(g.dir) * 7), this.sy(g.y + Math.sin(g.dir) * 7), 3.5 * this.scale, 0, Math.PI * 2);
      c.fill();
      // Suspicion arc.
      if (g.suspicion > 0.12 && g.mode === 'patrol') {
        c.strokeStyle = PALETTE.goldBright;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.sx(g.x), this.sy(g.y), 21 * this.scale, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
        c.stroke();
      }
      if (g.mode === 'grace') {
        c.fillStyle = PALETTE.danger;
        c.font = `700 ${Math.round(20 * this.scale)}px ui-monospace, monospace`;
        c.textAlign = 'center';
        c.fillText('!', this.sx(g.x), this.sy(g.y - 24));
      }
      if (g.mode === 'chase') {
        c.fillStyle = PALETTE.danger;
        c.font = `700 ${Math.round(12 * this.scale)}px ui-monospace, monospace`;
        c.textAlign = 'center';
        c.fillText('CHASING', this.sx(g.x), this.sy(g.y - 24));
      }
    }
  }

  drawThief(game) {
    const c = this.ctx;
    const t = game.thief;
    if (t.venting > 0) return; // inside the vent, out of sight
    // Sneak ring.
    if (t.sneaking) {
      c.strokeStyle = PALETTE.thiefRing;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(this.sx(t.x), this.sy(t.y), 19 * this.scale, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = PALETTE.thief;
    c.beginPath();
    c.arc(this.sx(t.x), this.sy(t.y), 13 * this.scale, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#8fa3c8';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(this.sx(t.x + Math.cos(t.face) * 6), this.sy(t.y + Math.sin(t.face) * 6), 3.5 * this.scale, 0, Math.PI * 2);
    c.fill();
    // Action progress ring.
    if (t.action) {
      const p = t.action.t / t.action.need;
      c.strokeStyle = PALETTE.goldBright;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.sx(t.x), this.sy(t.y), 20 * this.scale, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      c.stroke();
    }
  }

  scrim(alpha = 0.78) {
    const c = this.ctx;
    c.fillStyle = `rgba(5,7,10,${alpha})`;
    c.fillRect(0, 0, W, H);
  }

  drawTitle(game) {
    const c = this.ctx;
    this.scrim(0.72);
    c.textAlign = 'center';
    c.strokeStyle = PALETTE.gold;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(W / 2 - 130, 170);
    c.lineTo(W / 2 + 130, 170);
    c.stroke();
    c.fillStyle = '#f2f0e8';
    c.font = '700 64px Georgia, "Times New Roman", serif';
    c.fillText('THE MARLOWE JOB', W / 2, 250);
    c.fillStyle = PALETTE.goldBright;
    c.font = '600 20px ui-monospace, monospace';
    c.fillText('A  MUSEUM  HEIST  IN  THREE  ROOMS', W / 2, 292);
    c.fillStyle = PALETTE.inkDim;
    c.font = '16px ui-monospace, monospace';
    c.fillText('Steal the Star of Marlowe. Dodge the patrols. Mind the cameras.', W / 2, 340);
    c.fillStyle = PALETTE.goldBright;
    c.font = '600 19px ui-monospace, monospace';
    c.fillText('PRESS ENTER — OR CLICK — TO BEGIN', W / 2, 420);
    c.fillStyle = PALETTE.ink;
    c.font = '15px ui-monospace, monospace';
    c.fillText('WASD / ARROWS — move      SHIFT — sneak      E — grab / use', W / 2, 480);
    c.fillText('Q or CLICK — smoke bomb      R — EMP      P — pause', W / 2, 506);
    c.fillStyle = PALETTE.inkDim;
    c.font = '15px ui-monospace, monospace';
    c.fillText('Guards see in cones. Cameras sweep. The alarm only ever goes up.', W / 2, 556);
    c.fillText('Three rooms. One night. $124,000 on the walls.', W / 2, 582);
    if (game.bestTake > 0) {
      c.fillStyle = PALETTE.goldBright;
      c.font = '600 16px ui-monospace, monospace';
      c.fillText(`BEST TAKE: $${game.bestTake.toLocaleString('en-US')}`, W / 2, 626);
    }
    void game;
  }

  drawCaught(game) {
    const c = this.ctx;
    this.scrim(0.45);
    c.textAlign = 'center';
    c.fillStyle = PALETTE.danger;
    c.font = '700 56px Georgia, "Times New Roman", serif';
    c.fillText('CAUGHT', W / 2, 330);
    c.fillStyle = PALETTE.ink;
    c.font = '18px ui-monospace, monospace';
    c.fillText('The guard has you. One life gone — the room resets.', W / 2, 372);
    void game;
  }

  drawRoomClear(game) {
    const c = this.ctx;
    this.scrim(0.55);
    c.textAlign = 'center';
    c.fillStyle = PALETTE.safe;
    c.font = '700 48px Georgia, "Times New Roman", serif';
    c.fillText('ROOM CLEAR', W / 2, 300);
    c.fillStyle = PALETTE.ink;
    c.font = '20px ui-monospace, monospace';
    c.fillText(`${game.room.name} — $${game.roomResults[game.roomResults.length - 1].loot.toLocaleString('en-US')} taken`, W / 2, 348);
    c.fillStyle = PALETTE.goldBright;
    c.font = '18px ui-monospace, monospace';
    c.fillText(`Time bonus +$${game.clearBonus.toLocaleString('en-US')}`, W / 2, 382);
    void game;
  }

  drawGameOver(game) {
    const c = this.ctx;
    this.scrim(0.82);
    c.textAlign = 'center';
    c.fillStyle = PALETTE.danger;
    c.font = '700 56px Georgia, "Times New Roman", serif';
    c.fillText('THE JOB IS BLOWN', W / 2, 300);
    c.fillStyle = PALETTE.ink;
    c.font = '19px ui-monospace, monospace';
    c.fillText(`Three lives gone. The take stays at $${game.loot.toLocaleString('en-US')}.`, W / 2, 348);
    c.fillStyle = PALETTE.goldBright;
    c.font = '600 18px ui-monospace, monospace';
    c.fillText('PRESS ENTER TO TRY AGAIN', W / 2, 420);
    void game;
  }

  drawPaused() {
    const c = this.ctx;
    this.scrim(0.5);
    c.textAlign = 'center';
    c.fillStyle = PALETTE.ink;
    c.font = '700 44px Georgia, "Times New Roman", serif';
    c.fillText('PAUSED', W / 2, 340);
    c.fillStyle = PALETTE.inkDim;
    c.font = '17px ui-monospace, monospace';
    c.fillText('Press P to carry on.', W / 2, 380);
  }

  drawEnd(game) {
    const c = this.ctx;
    c.fillStyle = '#0a0c10';
    c.fillRect(0, 0, W, H);
    c.textAlign = 'center';
    c.strokeStyle = PALETTE.gold;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(W / 2 - 130, 128);
    c.lineTo(W / 2 + 130, 128);
    c.stroke();
    c.fillStyle = '#f2f0e8';
    c.font = '700 58px Georgia, "Times New Roman", serif';
    c.fillText('THE GETAWAY', W / 2, 200);
    c.fillStyle = PALETTE.inkDim;
    c.font = '17px ui-monospace, monospace';
    c.fillText('Three rooms. One van. Nobody saw a thing — or almost nobody.', W / 2, 238);
    c.fillStyle = PALETTE.goldBright;
    c.font = '700 34px ui-monospace, monospace';
    c.fillText(`FINAL TAKE   $${game.finalTake.toLocaleString('en-US')}`, W / 2, 306);
    c.fillStyle = PALETTE.ink;
    c.font = '600 18px ui-monospace, monospace';
    const ghost = game.ghost ? `GHOST BONUS +$${GHOST_BONUS.toLocaleString('en-US')}` : 'NO GHOST BONUS';
    c.fillText(`RATING:  ${game.rating}    ·    ${ghost}`, W / 2, 352);
    c.fillStyle = PALETTE.inkDim;
    c.font = '16px ui-monospace, monospace';
    const mm = Math.floor(game.time / 60);
    const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
    c.fillText(`TOTAL TIME  ${mm}:${ss}      PEAK ALARM  ${Math.round(game.peakAlarm)}%`, W / 2, 388);
    c.font = '15px ui-monospace, monospace';
    game.roomResults.forEach((r, i) => {
      const rm = Math.floor(r.time / 60);
      const rs = String(Math.floor(r.time % 60)).padStart(2, '0');
      c.fillText(`${r.name} — $${r.loot.toLocaleString('en-US')} in ${rm}:${rs}`, W / 2, 436 + i * 28);
    });
    c.fillStyle = PALETTE.goldBright;
    c.font = '600 18px ui-monospace, monospace';
    c.fillText('PRESS ENTER TO PLAY AGAIN', W / 2, 600);
  }
}

// The ghost bonus, named here so the end screen can quote it.
import { GHOST_BONUS } from './tune.js';
void ROOMS;
