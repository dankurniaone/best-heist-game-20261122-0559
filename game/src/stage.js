// Staged scenes for screenshots: ?shot=start|play|vault|end (with
// ?seed=1). Each scene sets an exact, deterministic state and freezes the
// simulation, so the same URL always renders the same frame. The scenes
// are the game's real states — a title over room one, a mid-heist frame
// with a guard cone on the thief, the vault hall mid-chase, and the
// getaway screen — never a composite or an edit.

import { STAGE } from './tune.js';
import { ROOMS } from './rooms.js';

export function applyShot(game, name) {
  if (name === 'start') {
    game.screen = 'title';
    game.bestTake = 86000;
    return true;
  }
  if (name === 'play') {
    game.startRun();
    game.screen = 'playing';
    game.loot = STAGE.play.loot;
    game.time = STAGE.play.time;
    game.roomTime = STAGE.play.time;
    game.alarm.value = STAGE.play.alarm;
    game.alarm.peak = STAGE.play.alarm;
    game.peakAlarm = STAGE.play.alarm;
    game.taken.add('paint-a');
    game.thief.x = 560;
    game.thief.y = 380;
    game.thief.face = Math.PI / 2;
    game.thief.sneaking = true;
    // Guard A mid-patrol, cone sweeping toward the thief.
    game.guards[0].x = 420;
    game.guards[0].y = 300;
    game.guards[0].dir = Math.atan2(380 - 300, 560 - 420);
    game.guards[0].suspicion = 0.45;
    // Guard B on the right wall, cone across the room.
    game.guards[1].x = 1000;
    game.guards[1].y = 240;
    game.guards[1].dir = Math.PI;
    // Camera cone visible, thief just outside it.
    game.cameras[0].dir = Math.PI / 2 + 0.35;
    game.toast = 'The east guard is turning — go now, quiet and low.';
    game.toastT = 99;
    return true;
  }
  if (name === 'vault') {
    game.startRun();
    game.screen = 'playing';
    game.loadRoom(1);
    game.loot = STAGE.vault.loot;
    game.time = STAGE.vault.time;
    game.roomTime = 126;
    game.alarm.value = STAGE.vault.alarm;
    game.alarm.peak = STAGE.vault.alarm;
    game.peakAlarm = STAGE.vault.alarm;
    game.vaultOpen = true;
    game.taken.add('gold-a');
    game.taken.add('paint-c');
    game.thief.x = 600;
    game.thief.y = 320;
    game.thief.face = Math.PI;
    // One guard mid-chase, cone on the thief.
    game.guards[0].x = 480;
    game.guards[0].y = 320;
    game.guards[0].dir = 0;
    game.guards[0].mode = 'chase';
    game.guards[0].suspicion = 1;
    game.guards[0].lastSeen = { x: 600, y: 320 };
    // The other guard patrols the right wall.
    game.guards[1].x = 950;
    game.guards[1].y = 420;
    game.guards[1].dir = -Math.PI / 2;
    // Lasers mid-slide, gaps readable.
    game.lasers.beams[0].gap = 420;
    game.lasers.beams[1].gap = 640;
    game.lasers.beams[2].gap = 500;
    game.cameras[0].dir = Math.PI / 2 - 0.3;
    game.cameras[1].dir = Math.PI / 2 + 0.4;
    game.toast = 'Vault open — the guard is on you. Break the cone.';
    game.toastT = 99;
    return true;
  }
  if (name === 'end') {
    game.startRun();
    game.screen = 'end';
    game.loot = 108000;
    game.time = 412;
    game.peakAlarm = 41;
    game.roomResults = [
      { name: ROOMS[0].name, loot: 58000, time: 138, bonus: 600 },
      { name: ROOMS[1].name, loot: 38000, time: 171, bonus: 450 },
      { name: ROOMS[2].name, loot: 12000, time: 103, bonus: 850 },
    ];
    return true;
  }
  return false;
}
