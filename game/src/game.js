// The Marlowe Job: game state, rules and scoring. Screens: title, play, caught,
// levelDone, win, gameover. Levels are loaded from levels.js; guards, cameras,
// lasers and the alarm are updated here and handed to render.js to draw.

import { ALARM, GHOST_BONUS, GHOST_THRESHOLD, GUARD, LIVES, TOOLS } from './config.js';
import { LEVELS, TOTAL_LOOT } from './levels.js';
import { createPlayer, movePlayer, spotFactor } from './player.js';
import { createGuard, updateGuard } from './guard.js';
import { createAlarm, createCamera, createLaser, updateAlarm, updateCamera, updateLaser } from './security.js';
import { clamp, dist } from './geom.js';

const INTERACT_RANGE = 46;

export function createGame() {
  const game = {
    screen: 'title',
    paused: false,
    levelIndex: 0,
    level: null,
    player: null,
    guards: [],
    cameras: [],
    lasers: [],
    alarm: createAlarm(0),
    loot: [],
    vaultCracked: false,
    vaultGold: 0,
    lootValue: 0,
    levelLoot: 0,
    levelTime: 0,
    totalTime: 0,
    lives: LIVES,
    smokeLeft: TOOLS.smokeCount,
    empLeft: TOOLS.empCount,
    clouds: [],
    empUntil: 0,
    now: 0,
    floats: [],
    message: '',
    messageTimer: 0,
    flash: 0,
    peakAlarmAll: 0,
    levelStats: [],
    rating: '',
    best: 0,
  };
  // The title screen shows the first room dimmed behind it, so load it as a
  // backdrop now; starting a run reloads it fresh.
  loadLevel(game, 0);
  game.screen = 'title';
  return game;
}

export function loadLevel(game, index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.level = def;
  game.player = createPlayer(def.start.x, def.start.y);
  game.guards = def.guards.map(createGuard);
  game.cameras = def.cameras.map(createCamera);
  game.lasers = def.lasers.map(createLaser);
  game.alarm = createAlarm(def.alarmStart);
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.vaultCracked = false;
  game.vaultGold = def.vault ? def.vault.gold : 0;
  game.levelLoot = 0;
  game.levelTime = 0;
  game.smokeLeft = TOOLS.smokeCount;
  game.empLeft = TOOLS.empCount;
  game.clouds = [];
  game.floats = [];
  game.message = '';
  game.messageTimer = 0;
  game.flash = 0;
  game.screen = 'play';
}

function say(game, text, seconds) {
  game.message = text;
  game.messageTimer = seconds || 3;
}

function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color: color || '#f5d67a', life: 1.4 });
}

function exitUnlocked(game) {
  const lock = game.level.exit.lockedUntil;
  if (!lock) return true;
  if (lock === 'diamond') return game.loot.find((l) => l.id === 'diamond')?.taken;
  if (lock === 'vault') return game.vaultCracked;
  return true;
}

function nearestInteractable(game) {
  const p = game.player;
  for (const l of game.loot) {
    if (!l.taken && dist(p.x, p.y, l.x, l.y) < INTERACT_RANGE) {
      return { kind: 'loot', loot: l };
    }
  }
  if (game.level.vault && !game.vaultCracked) {
    const v = game.level.vault;
    const cx = clamp(p.x, v.x, v.x + v.w);
    const cy = clamp(p.y, v.y, v.y + v.h);
    if (dist(p.x, p.y, cx, cy) < 56) return { kind: 'vault' };
  }
  for (const vent of game.level.vents) {
    const cx = vent.x + vent.w / 2;
    const cy = vent.y + vent.h / 2;
    if (dist(p.x, p.y, cx, cy) < INTERACT_RANGE + 10) return { kind: 'vent', vent };
  }
  return null;
}

function ratingFor(peak) {
  if (peak <= GHOST_THRESHOLD) return 'GHOST';
  if (peak <= 60) return 'PROFESSIONAL';
  return 'SMASH-AND-GRAB';
}

export function update(game, input, audio, dt) {
  game.now += dt;

  if (game.screen === 'title') {
    if (input.pressed('confirm') || input.drainClicks().length > 0) {
      audio.unlock();
      audio.click();
      game.lootValue = 0;
      game.totalTime = 0;
      game.lives = LIVES;
      game.peakAlarmAll = 0;
      game.levelStats = [];
      loadLevel(game, 0);
      say(game, game.level.subtitle, 4);
    }
    return;
  }

  if (game.screen === 'levelDone') {
    if (input.pressed('confirm') || input.drainClicks().length > 0) {
      audio.click();
      if (game.levelIndex + 1 < LEVELS.length) {
        loadLevel(game, game.levelIndex + 1);
        say(game, game.level.subtitle, 4);
      } else {
        finishRun(game);
      }
    }
    return;
  }

  if (game.screen === 'caught') {
    if (input.pressed('confirm') || input.drainClicks().length > 0) {
      audio.click();
      if (game.lives > 0) {
        game.lootValue -= game.levelLoot;
        loadLevel(game, game.levelIndex);
        say(game, game.level.subtitle, 4);
      } else {
        game.screen = 'gameover';
      }
    }
    return;
  }

  if (game.screen === 'win' || game.screen === 'gameover') {
    if (input.pressed('confirm') || input.drainClicks().length > 0) {
      audio.click();
      game.screen = 'title';
    }
    return;
  }

  if (game.screen !== 'play') return;

  if (input.pressed('pause')) {
    game.paused = !game.paused;
    return;
  }
  if (game.paused) return;

  const p = game.player;
  p.stance = input.held('sneak') ? 'sneak' : 'walk';
  movePlayer(p, input.axis(), dt, game.level.walls);
  game.levelTime += dt;
  game.totalTime += dt;
  game.peakAlarmAll = Math.max(game.peakAlarmAll, game.alarm.value);

  // Smoke clouds fade out.
  game.clouds = game.clouds.filter((c) => game.now < c.until);
  for (const f of game.floats) f.life -= dt;
  game.floats = game.floats.filter((f) => f.life > 0);
  if (game.messageTimer > 0) game.messageTimer -= dt;
  if (game.flash > 0) game.flash -= dt;

  // Tools: Q or a click tosses smoke; R fires the EMP.
  if (input.pressed('smoke') && game.smokeLeft > 0) {
    throwSmoke(game, p.x, p.y);
    audio.smoke();
  }
  for (const click of input.drainClicks()) {
    if (game.smokeLeft > 0) {
      const d = dist(p.x, p.y, click.x, click.y);
      if (d <= 300) throwSmoke(game, click.x, click.y);
      else throwSmoke(game, p.x + ((click.x - p.x) / d) * 300, p.y + ((click.y - p.y) / d) * 300);
      audio.smoke();
    }
  }
  if (input.pressed('emp') && game.empLeft > 0) {
    game.empLeft -= 1;
    game.empUntil = game.now + 8;
    for (const c of game.cameras) c.disabledUntil = game.empUntil;
    say(game, 'EMP burst — cameras blind for 8 seconds.', 3);
    audio.emp();
  }

  // Interaction: instant grab for loot, hold E for the vault and the vents.
  const target = nearestInteractable(game);
  if (target && target.kind === 'loot' && input.pressed('interact')) {
    target.loot.taken = true;
    game.lootValue += target.loot.value;
    game.levelLoot += target.loot.value;
    addFloat(game, target.loot.x, target.loot.y - 24, `+$${target.loot.value.toLocaleString()}`);
    say(game, `${target.loot.name} — $${target.loot.value.toLocaleString()}.`, 2.5);
    if (target.loot.kind === 'diamond') audio.diamond();
    else audio.pickup();
  }
  if (target && (target.kind === 'vault' || target.kind === 'vent') && input.held('interact')) {
    const seconds = target.kind === 'vault' ? game.level.vault.crackSeconds : target.vent.seconds;
    p.interactTarget = target.kind;
    p.interactProgress = Math.min(1, p.interactProgress + dt / seconds);
    if (p.interactProgress >= 1) {
      p.interactProgress = 0;
      p.interactTarget = null;
      if (target.kind === 'vault') {
        game.vaultCracked = true;
        game.lootValue += game.vaultGold;
        game.levelLoot += game.vaultGold;
        addFloat(game, game.level.vault.x + 75, game.level.vault.y - 10, `+$${game.vaultGold.toLocaleString()}`, '#7fd4ff');
        say(game, 'Vault open — the gold is yours. Get to the door.', 3);
        audio.diamond();
      } else {
        p.x = target.vent.to.x;
        p.y = target.vent.to.y;
        say(game, 'Through the duct — the patrols never look here.', 3);
        audio.smoke();
      }
    }
  } else {
    p.interactProgress = 0;
    p.interactTarget = null;
  }

  // Guards and cameras.
  const spotRange = GUARD.viewRange * spotFactor(p);
  let seenByGuard = false;
  let caught = false;
  for (const g of game.guards) {
    const res = updateGuard(g, p, spotRange, game.level.walls, game.clouds, dt);
    if (res.sees) seenByGuard = true;
    if (res.caught) caught = true;
    if (res.warned) audio.spotted();
  }
  let seenByCamera = false;
  for (const c of game.cameras) {
    if (updateCamera(c, game.now, p, game.level.walls, game.clouds)) seenByCamera = true;
  }
  if (seenByCamera && game.alarm.value > 60) audio.alarm();

  // Lasers: a trip spikes the alarm and flashes the screen.
  for (const l of game.lasers) {
    if (updateLaser(l, game.now, p)) {
      game.alarm.value = Math.min(ALARM.max, game.alarm.value + 25);
      game.flash = 0.35;
      say(game, 'Laser tripped! The alarm jumps.', 2.5);
      audio.alarm();
    }
  }

  if (updateAlarm(game.alarm, dt, seenByGuard, seenByCamera) || caught) {
    game.lives -= 1;
    audio.caught();
    game.screen = 'caught';
    return;
  }

  // The exit: walk into it once its lock is satisfied.
  const e = game.level.exit;
  const unlocked = exitUnlocked(game);
  if (unlocked && p.x > e.x - 10 && p.x < e.x + e.w + 10 && p.y > e.y - 10 && p.y < e.y + e.h + 10) {
    const timeBonus = Math.max(0, Math.round((game.level.parSeconds - game.levelTime) * 100));
    game.lootValue += timeBonus;
    game.levelLoot += timeBonus;
    game.levelStats.push({
      name: game.level.name,
      loot: game.levelLoot,
      time: game.levelTime,
      par: game.level.parSeconds,
      timeBonus,
      peakAlarm: Math.round(game.alarm.peak),
    });
    audio.win();
    game.screen = 'levelDone';
    return;
  }
  if (!unlocked && p.x > e.x - 40 && p.x < e.x + e.w + 40 && p.y > e.y - 40 && p.y < e.y + e.h + 40) {
    const lock = game.level.exit.lockedUntil === 'diamond'
      ? 'Locked — take the Star of Marlowe first.'
      : 'Locked — crack the vault first.';
    say(game, lock, 2);
  }
}

function throwSmoke(game, x, y) {
  game.smokeLeft -= 1;
  game.clouds.push({ x, y, radius: TOOLS.smokeRadius, until: game.now + TOOLS.smokeSeconds });
}

function finishRun(game) {
  const ghost = game.peakAlarmAll <= GHOST_THRESHOLD;
  if (ghost) game.lootValue += GHOST_BONUS;
  game.rating = ratingFor(game.peakAlarmAll);
  game.screen = 'win';
}

export { TOTAL_LOOT, GHOST_BONUS };
