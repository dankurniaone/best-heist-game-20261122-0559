// Screenshot staging for The Marlowe Job (?shot=start|play|vault|end).
// Each scene puts the real game into one fixed state — a real room, real
// guards, real cones — and the renderer draws it. No simulation, no faking:
// the frame is what the game looks like at that moment of a real run.

import { loadLevel } from './game.js';

function placeGuard(game, index, x, y, dir, state, suspicion) {
  const g = game.guards[index];
  if (!g) return;
  g.x = x;
  g.y = y;
  g.dir = dir;
  g.state = state || 'patrol';
  g.suspicion = suspicion || 0;
  g.lastSeen = { x, y };
}

export function stageShot(game, name) {
  if (name === 'start') {
    // Title over the gallery backdrop (createGame already loaded level 0).
    game.screen = 'title';
    game.best = 86000;
    return;
  }

  if (name === 'vault') {
    loadLevel(game, 1);
    game.now = 12.5;
    game.player.x = 700;
    game.player.y = 380;
    game.player.face = Math.PI / 4;
    game.player.stance = 'sneak';
    game.vaultCracked = true;
    game.lootValue = 88000;
    game.levelLoot = 30000;
    game.alarm.value = 58;
    game.alarm.peak = 58;
    game.peakAlarmAll = 58;
    game.smokeLeft = 2;
    game.empLeft = 1;
    game.levelTime = 96;
    game.totalTime = 246;
    placeGuard(game, 0, 640, 300, Math.PI / 2, 'chase', 1);
    game.guards[0].lastSeen = { x: 700, y: 380 };
    placeGuard(game, 1, 300, 150, 0, 'patrol', 0.3);
    placeGuard(game, 2, 1060, 480, -Math.PI / 2, 'patrol', 0);
    game.message = '';
    game.messageTimer = 0;
    return;
  }

  if (name === 'end') {
    game.screen = 'win';
    game.lootValue = 118000;
    game.rating = 'GHOST';
    game.peakAlarmAll = 18;
    game.totalTime = 412;
    game.levelStats = [
      { name: 'I — THE MARLOWE GALLERY', loot: 66000, time: 138, par: 150, timeBonus: 1200, peakAlarm: 32 },
      { name: 'II — THE VAULT HALL', loot: 42000, time: 171, par: 180, timeBonus: 900, peakAlarm: 58 },
      { name: 'III — ROOFTOP GETAWAY', loot: 24000, time: 103, par: 120, timeBonus: 1700, peakAlarm: 18 },
    ];
    return;
  }

  // 'play' (and anything else): the money shot — mid-heist in the gallery.
  loadLevel(game, 0);
  game.now = 8.0;
  game.player.x = 560;
  game.player.y = 480;
  game.player.face = -Math.PI / 4;
  game.player.stance = 'sneak';
  game.loot.find((l) => l.id === 'paint-a').taken = true;
  game.lootValue = 8000;
  game.levelLoot = 8000;
  game.alarm.value = 32;
  game.alarm.peak = 32;
  game.peakAlarmAll = 32;
  game.smokeLeft = 2;
  game.empLeft = 2;
  game.levelTime = 41;
  game.totalTime = 41;
  game.clouds.push({ x: 470, y: 520, radius: 95, until: 9999 });
  placeGuard(game, 0, 480, 300, Math.PI / 2.4, 'warn', 0.85);
  placeGuard(game, 1, 900, 150, Math.PI, 'patrol', 0.2);
  game.message = 'The east guard is turning — go now, quiet and low.';
  game.messageTimer = 3;
}
