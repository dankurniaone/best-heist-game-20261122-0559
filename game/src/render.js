// Every pixel of The Marlowe Job. One canvas, one fixed view: a night museum
// drawn as a lit floor plan — deep navy floors, stone walls with a gold trim,
// warm light pools, and the loot in gold and ice-blue. The HUD lives inside
// the frame so every screenshot carries the alarm meter and the objective.

import { GUARD, HUD_HEIGHT, PALETTE, ROOM, VIEW, WALL } from './config.js';
import { CAMERA } from './config.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

function cone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtMoney(n) { return `$${Math.round(n).toLocaleString()}`; }
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function drawRoom(ctx, game) {
  const level = game.level;
  // Floor: large checker tiles with a faint grid — a plan, not a tile set.
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(ROOM.x + tx * 77, ROOM.y + ty * 78, 77, 78);
    }
  }
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i += 1) {
    ctx.beginPath();
    ctx.moveTo(ROOM.x + i * 77, ROOM.y);
    ctx.lineTo(ROOM.x + i * 77, ROOM.y + ROOM.height);
    ctx.stroke();
  }
  for (let i = 0; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(ROOM.x, ROOM.y + i * 78);
    ctx.lineTo(ROOM.x + ROOM.width, ROOM.y + i * 78);
    ctx.stroke();
  }
  // Warm light pools under the ceiling lights.
  const lights = [[320, 180], [640, 180], [960, 180], [320, 560], [640, 560], [960, 560]];
  for (const [lx, ly] of lights) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
    g.addColorStop(0, 'rgba(245, 214, 122, 0.10)');
    g.addColorStop(1, 'rgba(245, 214, 122, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 190, ly - 190, 380, 380);
  }

  // Outer walls.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, WALL);
  ctx.fillRect(ROOM.x, ROOM.y + ROOM.height - WALL, ROOM.width, WALL);
  ctx.fillRect(ROOM.x, ROOM.y, WALL, ROOM.height);
  ctx.fillRect(ROOM.x + ROOM.width - WALL, ROOM.y, WALL, ROOM.height);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + WALL, ROOM.y + WALL, ROOM.width - WALL * 2, ROOM.height - WALL * 2);
  // Interior walls. A 90x60 block is a display plinth: draw the exhibit on it.
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w, w.h);
    if (w.w === 90 && w.h === 60) {
      const cx = w.x + w.w / 2;
      const cy = w.y + w.h / 2;
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(cx - 16, cy + 2, 32, 12);
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(cx, cy - 6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0e13';
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawExit(ctx, game);
  for (const v of level.vents) drawVent(ctx, v);
  for (const l of game.loot) drawLoot(ctx, l);
  if (level.vault) drawVault(ctx, level.vault, game.vaultCracked);
  for (const lz of game.lasers) drawLaser(ctx, lz);
  for (const c of game.cameras) drawCamera(ctx, c, game.now);
  for (const g of game.guards) drawGuard(ctx, g);
  drawPlayer(ctx, game.player);
  drawSmoke(ctx, game.clouds);
  drawFloats(ctx, game.floats);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(229, 72, 77, ${game.flash * 0.5})`;
    ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const unlocked = game.level.exit.lockedUntil === null
    || (game.level.exit.lockedUntil === 'diamond' && game.loot.find((l) => l.id === 'diamond')?.taken)
    || (game.level.exit.lockedUntil === 'vault' && game.vaultCracked);
  ctx.fillStyle = unlocked ? PALETTE.ok : PALETTE.warn;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#0b0e13';
  ctx.font = `700 11px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(unlocked ? 'EXIT OPEN' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2);
  ctx.fillStyle = unlocked ? PALETTE.ok : PALETTE.muted;
  ctx.font = `600 11px ${MONO}`;
  // Label below the door, unless the door sits on the bottom wall — then above.
  const labelY = e.y > 400 ? e.y - 10 : e.y + e.h + 14;
  ctx.fillText(e.label, e.x + e.w / 2, labelY);
}

function drawVent(ctx, v) {
  ctx.fillStyle = '#1b1f1d';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = PALETTE.muted;
  ctx.lineWidth = 1;
  ctx.strokeRect(v.x + 0.5, v.y + 0.5, v.w, v.h);
  ctx.beginPath();
  for (let i = 1; i < 5; i += 1) {
    ctx.moveTo(v.x + 4, v.y + (v.h / 5) * i);
    ctx.lineTo(v.x + v.w - 4, v.y + (v.h / 5) * i);
  }
  ctx.stroke();
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText('VENT', v.x + v.w / 2, v.y - 8);
}

function drawLoot(ctx, loot) {
  if (loot.taken) return;
  if (loot.kind === 'diamond') {
    // The Star of Marlowe on its pedestal, under glass.
    ctx.fillStyle = '#232a38';
    ctx.fillRect(loot.x - 26, loot.y + 8, 52, 14);
    ctx.strokeStyle = 'rgba(191, 233, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(loot.x - 24, loot.y - 26, 48, 36);
    ctx.fillStyle = 'rgba(191, 233, 255, 0.10)';
    ctx.fillRect(loot.x - 24, loot.y - 26, 48, 36);
    const pulse = 0.75 + Math.sin(Date.now() / 350) * 0.25;
    const g = ctx.createRadialGradient(loot.x, loot.y - 8, 2, loot.x, loot.y - 8, 44);
    g.addColorStop(0, `rgba(191, 233, 255, ${0.5 * pulse})`);
    g.addColorStop(1, 'rgba(191, 233, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(loot.x - 44, loot.y - 52, 88, 88);
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 24);
    ctx.lineTo(loot.x + 13, loot.y - 8);
    ctx.lineTo(loot.x, loot.y + 6);
    ctx.lineTo(loot.x - 13, loot.y - 8);
    ctx.closePath();
    ctx.fillStyle = PALETTE.diamond;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(loot.x - 13, loot.y - 8);
    ctx.lineTo(loot.x + 13, loot.y - 8);
    ctx.moveTo(loot.x, loot.y - 24);
    ctx.lineTo(loot.x, loot.y + 6);
    ctx.stroke();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = `700 12px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('★ THE STAR OF MARLOWE ★', loot.x, loot.y + 40);
    return;
  }
  if (loot.kind === 'painting') {
    ctx.fillStyle = '#2a2118';
    ctx.fillRect(loot.x - 34, loot.y - 24, 68, 48);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(loot.x - 34, loot.y - 24, 68, 48);
    // A small abstract canvas inside the frame — the painting itself.
    ctx.fillStyle = '#31435e';
    ctx.fillRect(loot.x - 28, loot.y - 18, 56, 36);
    ctx.fillStyle = '#c96a27';
    ctx.beginPath();
    ctx.arc(loot.x - 10, loot.y - 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fb069';
    ctx.fillRect(loot.x + 2, loot.y + 2, 20, 12);
    ctx.fillStyle = '#e8ece9';
    ctx.font = `600 10px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText(fmtMoney(loot.value), loot.x, loot.y + 38);
    return;
  }
  // Gold bar.
  ctx.fillStyle = '#8a6d1f';
  ctx.beginPath();
  ctx.moveTo(loot.x - 16, loot.y + 8);
  ctx.lineTo(loot.x - 11, loot.y - 8);
  ctx.lineTo(loot.x + 11, loot.y - 8);
  ctx.lineTo(loot.x + 16, loot.y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.beginPath();
  ctx.moveTo(loot.x - 11, loot.y - 8);
  ctx.lineTo(loot.x + 11, loot.y - 8);
  ctx.lineTo(loot.x + 8, loot.y - 2);
  ctx.lineTo(loot.x - 8, loot.y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = `600 10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(fmtMoney(loot.value), loot.x, loot.y + 24);
}

function drawVault(ctx, vault, cracked) {
  ctx.fillStyle = '#2b313c';
  ctx.fillRect(vault.x, vault.y, vault.w, vault.h);
  ctx.strokeStyle = cracked ? PALETTE.ok : PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(vault.x, vault.y, vault.w, vault.h);
  ctx.beginPath();
  ctx.arc(vault.x + vault.w / 2, vault.y + vault.h / 2, 26, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vault.x + vault.w / 2, vault.y + vault.h / 2);
  ctx.lineTo(vault.x + vault.w / 2 + 18, vault.y + vault.h / 2 - 10);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(cracked ? 'VAULT OPEN' : 'VAULT — HOLD E TO CRACK', vault.x + vault.w / 2, vault.y - 10);
}

function drawLaser(ctx, lz) {
  ctx.strokeStyle = 'rgba(229, 72, 77, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lz.x1, lz.y);
  ctx.lineTo(lz.gapCenter - lz.gap / 2, lz.y);
  ctx.moveTo(lz.gapCenter + lz.gap / 2, lz.y);
  ctx.lineTo(lz.x2, lz.y);
  ctx.stroke();
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath();
  ctx.arc(lz.x1, lz.y, 4, 0, Math.PI * 2);
  ctx.arc(lz.x2, lz.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCamera(ctx, camera, now) {
  const disabled = now < camera.disabledUntil;
  if (!disabled) {
    cone(ctx, camera.x, camera.y, camera.angle, camera.range, CAMERA.angle,
      PALETTE.coneCamera, PALETTE.coneCameraEdge);
  }
  ctx.fillStyle = disabled ? '#3a3f4a' : '#20242c';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = disabled ? PALETTE.muted : PALETTE.danger;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = disabled ? PALETTE.muted : PALETTE.danger;
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 10px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('OFFLINE', camera.x, camera.y + 24);
  } else if (camera.seesPlayer) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = `700 16px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', camera.x, camera.y - 16);
  }
}

function drawGuard(ctx, g) {
  cone(ctx, g.x, g.y, g.dir, GUARD.viewRange, GUARD.viewAngle,
    g.state === 'chase' ? 'rgba(229, 72, 77, 0.22)' : PALETTE.coneGuard,
    g.state === 'chase' ? 'rgba(229, 72, 77, 0.6)' : PALETTE.coneGuardEdge);
  // Body: dark uniform, cap brim toward the facing direction.
  ctx.fillStyle = '#1d2733';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.state === 'chase' ? PALETTE.danger : '#5a6b7d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0f141c';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.dir) * 7, g.y + Math.sin(g.dir) * 7, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.dir) * 12, g.y + Math.sin(g.dir) * 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion bar + warning mark.
  if (g.suspicion > 0.05 && g.state !== 'chase') {
    ctx.fillStyle = '#20242c';
    ctx.fillRect(g.x - 16, g.y - 30, 32, 5);
    ctx.fillStyle = g.state === 'warn' ? PALETTE.danger : PALETTE.warn;
    ctx.fillRect(g.x - 16, g.y - 30, 32 * Math.min(1, g.suspicion), 5);
  }
  if (g.state === 'warn') {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = `700 22px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 36);
  }
  if (g.state === 'chase') {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = `700 13px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('CHASING', g.x, g.y - 32);
  }
}

function drawPlayer(ctx, p) {
  if (!p) return;
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak: a dark teardrop pointing where the thief faces.
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.face);
  ctx.fillStyle = '#14181f';
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.quadraticCurveTo(0, -14, -12, -8);
  ctx.quadraticCurveTo(-16, 0, -12, 8);
  ctx.quadraticCurveTo(0, 14, 16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#e8ece9';
  ctx.beginPath();
  ctx.arc(4, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (p.stance === 'sneak') {
    ctx.strokeStyle = 'rgba(63, 185, 107, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 19, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Hold-to-interact progress ring.
  if (p.interactTarget && p.interactProgress > 0) {
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, -Math.PI / 2, -Math.PI / 2 + p.interactProgress * Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, clouds) {
  for (const c of clouds) {
    const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.radius);
    g.addColorStop(0, PALETTE.smoke);
    g.addColorStop(1, 'rgba(180, 190, 205, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFloats(ctx, floats) {
  ctx.textAlign = 'center';
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.fillStyle = f.color;
    ctx.font = `700 15px ${MONO}`;
    ctx.fillText(f.text, f.x, f.y - (1.4 - f.life) * 30);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, HUD_HEIGHT - 1, VIEW.width, 1);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `700 15px ${SERIF}`;
  ctx.fillText('THE MARLOWE JOB', 24, 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 11px ${MONO}`;
  ctx.fillText(game.level ? game.level.name : 'A MUSEUM HEIST IN THREE ROOMS', 24, 40);

  // Loot.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 16px ${MONO}`;
  ctx.fillText(`LOOT ${fmtMoney(game.lootValue)}`, 330, 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 11px ${MONO}`;
  ctx.fillText(`of ${fmtMoney(124000)}  ·  TIME ${fmtTime(game.totalTime)}`, 330, 40);

  // Alarm meter.
  const ax = 600;
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `700 12px ${MONO}`;
  ctx.fillText('ALARM', ax, 20);
  const alarmColor = game.alarm.value < 40 ? PALETTE.ok : game.alarm.value < 70 ? PALETTE.warn : PALETTE.danger;
  ctx.fillStyle = '#20242c';
  ctx.fillRect(ax, 32, 240, 12);
  for (let i = 0; i < 10; i += 1) {
    const segOn = game.alarm.value >= (i + 1) * 10;
    ctx.fillStyle = segOn ? alarmColor : '#2c313a';
    ctx.fillRect(ax + 2 + i * 24, 34, 20, 8);
  }
  ctx.fillStyle = alarmColor;
  ctx.font = `700 13px ${MONO}`;
  ctx.fillText(`${Math.round(game.alarm.value)}%`, ax + 248, 40);

  // Lives and tools, right side, second row.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText(`♥`.repeat(game.lives) + `♡`.repeat(Math.max(0, 3 - game.lives)) + `   SMOKE ×${game.smokeLeft}   EMP ×${game.empLeft}`, 1256, 40);
  ctx.textAlign = 'left';

  // Objective line, right side, first row.
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = `600 11px ${MONO}`;
  ctx.textAlign = 'right';
  const objective = game.level && game.level.exit.lockedUntil === 'diamond'
    && !game.loot.find((l) => l.id === 'diamond')?.taken
    ? 'OBJECTIVE: STEAL THE STAR'
    : game.level && game.level.exit.lockedUntil === 'vault' && !game.vaultCracked
      ? 'OBJECTIVE: CRACK THE VAULT'
      : 'OBJECTIVE: REACH THE EXIT';
  ctx.fillText(objective, 1256, 20);
  ctx.textAlign = 'left';

  // Controls hint in the strip below the room — out of the play area.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WASD MOVE  ·  SHIFT SNEAK  ·  E GRAB / USE  ·  Q OR CLICK SMOKE  ·  R EMP  ·  P PAUSE', VIEW.width / 2, 710);
  ctx.textAlign = 'left';
}

function drawMessage(ctx, game) {
  if (game.messageTimer <= 0 || !game.message) return;
  ctx.globalAlpha = Math.min(1, game.messageTimer);
  ctx.fillStyle = 'rgba(11, 14, 19, 0.85)';
  const w = ctx.measureText(game.message).width + 32;
  roundRect(ctx, (VIEW.width - w) / 2, VIEW.height - 52, w, 32, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = `600 14px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.message, VIEW.width / 2, VIEW.height - 36);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function dimRoom(ctx) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.82)';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
}

function centerText(ctx, text, y, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW.width / 2, y);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, game) {
  drawHud(ctx, game);
  drawRoom(ctx, game);
  dimRoom(ctx);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(VIEW.width / 2 - 130, 168, 260, 2);
  centerText(ctx, 'THE MARLOWE JOB', 230, `700 76px ${SERIF}`, PALETTE.text);
  centerText(ctx, 'A MUSEUM HEIST IN THREE ROOMS', 292, `600 17px ${MONO}`, PALETTE.goldBright);
  centerText(ctx, 'Steal the Star of Marlowe. Dodge the patrols. Mind the cameras.', 340, `400 16px ${SERIF}`, PALETTE.muted);
  centerText(ctx, 'PRESS ENTER — OR CLICK — TO BEGIN', 430, `700 18px ${MONO}`, PALETTE.goldBright);
  centerText(ctx, 'WASD / ARROWS — move      SHIFT — sneak      E — grab / use      Q or CLICK — smoke bomb      R — EMP', 500, `600 13px ${MONO}`, PALETTE.text);
  centerText(ctx, 'Guards see in cones. Cameras sweep. The alarm only ever goes up.', 532, `400 14px ${SERIF}`, PALETTE.muted);
  centerText(ctx, 'Three rooms. One night. $124,000 on the walls.', 580, `600 13px ${MONO}`, PALETTE.muted);
  if (game.best > 0) {
    centerText(ctx, `BEST TAKE: ${fmtMoney(game.best)}`, 626, `700 14px ${MONO}`, PALETTE.gold);
  }
}

function drawLevelDone(ctx, game) {
  drawHud(ctx, game);
  drawRoom(ctx, game);
  dimRoom(ctx);
  const stat = game.levelStats[game.levelStats.length - 1];
  centerText(ctx, 'CLEAN GETAWAY', 220, `700 54px ${SERIF}`, PALETTE.text);
  centerText(ctx, game.level.name, 280, `600 15px ${MONO}`, PALETTE.goldBright);
  if (stat) {
    centerText(ctx, `ROOM TAKE  ${fmtMoney(stat.loot)}      TIME  ${fmtTime(stat.time)}  (PAR ${fmtTime(stat.par)})      TIME BONUS  ${fmtMoney(stat.timeBonus)}`, 350, `600 15px ${MONO}`, PALETTE.text);
    centerText(ctx, `PEAK ALARM THIS ROOM  ${stat.peakAlarm}%`, 386, `600 13px ${MONO}`, PALETTE.muted);
  }
  centerText(ctx, `TOTAL SO FAR  ${fmtMoney(game.lootValue)}`, 440, `700 18px ${MONO}`, PALETTE.goldBright);
  centerText(ctx, game.levelIndex + 1 < 3 ? 'PRESS ENTER FOR THE NEXT ROOM' : 'PRESS ENTER FOR THE FINAL TALLY', 520, `700 16px ${MONO}`, PALETTE.text);
}

function drawCaught(ctx, game) {
  drawHud(ctx, game);
  drawRoom(ctx, game);
  dimRoom(ctx);
  centerText(ctx, 'CAUGHT', 230, `700 72px ${SERIF}`, PALETTE.danger);
  centerText(ctx, game.alarm.value >= 100 ? 'The alarm hit 100% — the museum locked down around you.' : 'A guard got hands on you. The night is not over yet.', 300, `400 16px ${SERIF}`, PALETTE.text);
  centerText(ctx, `LIVES LEFT: ${game.lives}`, 360, `700 16px ${MONO}`, PALETTE.text);
  centerText(ctx, game.lives > 0 ? 'PRESS ENTER TO RUN THIS ROOM AGAIN' : 'PRESS ENTER', 440, `700 16px ${MONO}`, PALETTE.goldBright);
}

function drawWin(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(VIEW.width / 2 - 130, 128, 260, 2);
  centerText(ctx, 'THE GETAWAY', 180, `700 64px ${SERIF}`, PALETTE.text);
  centerText(ctx, 'Three rooms. One van. Nobody saw a thing — or almost nobody.', 232, `400 16px ${SERIF}`, PALETTE.muted);
  centerText(ctx, `FINAL TAKE  ${fmtMoney(game.lootValue)}`, 310, `700 34px ${MONO}`, PALETTE.goldBright);
  const ghost = game.peakAlarmAll <= 25;
  centerText(ctx, `RATING: ${game.rating}${ghost ? `  ·  GHOST BONUS +${fmtMoney(5000)}` : ''}`, 366, `700 18px ${MONO}`, PALETTE.text);
  centerText(ctx, `TOTAL TIME  ${fmtTime(game.totalTime)}      PEAK ALARM  ${Math.round(game.peakAlarmAll)}%`, 404, `600 14px ${MONO}`, PALETTE.muted);
  let y = 460;
  for (const s of game.levelStats) {
    centerText(ctx, `${s.name} — ${fmtMoney(s.loot)} in ${fmtTime(s.time)}`, y, `600 13px ${MONO}`, PALETTE.muted);
    y += 26;
  }
  centerText(ctx, 'PRESS ENTER TO PLAY AGAIN', 620, `700 16px ${MONO}`, PALETTE.goldBright);
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centerText(ctx, 'THE JOB IS BLOWN', 260, `700 56px ${SERIF}`, PALETTE.danger);
  centerText(ctx, `You kept ${fmtMoney(game.lootValue)} of the take before the museum woke up.`, 330, `400 16px ${SERIF}`, PALETTE.text);
  centerText(ctx, 'PRESS ENTER TO TRY AGAIN', 420, `700 16px ${MONO}`, PALETTE.goldBright);
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#0b0e13';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  switch (game.screen) {
    case 'title':
      drawTitle(ctx, game);
      break;
    case 'play':
      drawHud(ctx, game);
      drawRoom(ctx, game);
      drawMessage(ctx, game);
      if (game.paused) {
        dimRoom(ctx);
        centerText(ctx, 'PAUSED', 330, `700 48px ${SERIF}`, PALETTE.text);
        centerText(ctx, 'PRESS P TO KEEP STEALING', 400, `600 14px ${MONO}`, PALETTE.muted);
      }
      break;
    case 'levelDone':
      drawLevelDone(ctx, game);
      break;
    case 'caught':
      drawCaught(ctx, game);
      break;
    case 'win':
      drawWin(ctx, game);
      break;
    case 'gameover':
      drawGameOver(ctx, game);
      break;
    default:
      drawHud(ctx, game);
      break;
  }
}
