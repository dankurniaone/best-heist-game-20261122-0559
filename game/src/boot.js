// Boot: wires the canvas, the input, the sound and the game together and
// runs the fixed-step loop. The HUD is plain DOM above the canvas, updated
// every frame from the game's state.

import { Game } from './state.js';
import { Input } from './keys.js';
import { Renderer } from './draw.js';
import { Sfx } from './sfx.js';
import { applyShot } from './stage.js';
import { TOTAL_LOOT } from './tune.js';

const canvas = document.getElementById('game');
const game = new Game();
window.__game = game; // playtest hook: the automated test reads state here
const input = new Input(canvas);
const render = new Renderer(canvas);
const sfx = new Sfx();
input.onFirstGesture = () => sfx.ensure();

// The canvas maps the 1200x600 world into the page; the input needs the
// same mapping to turn mouse pixels into world points.
function fitView() {
  const r = canvas.getBoundingClientRect();
  const scale = Math.min(r.width / 1280, r.height / 720);
  input.view = { x: (r.width - 1280 * scale) / 2, y: (r.height - 720 * scale) / 2, scale };
}
window.addEventListener('resize', fitView);
fitView();

// A staged screenshot (?shot=play&seed=1) freezes the simulation: the
// frame is the scene, nothing advances.
const params = new URLSearchParams(location.search);
const staged = params.get('shot') ? applyShot(game, params.get('shot')) : false;

const el = (id) => document.getElementById(id);
const hud = {
  room: el('hud-room'),
  loot: el('hud-loot'),
  time: el('hud-time'),
  alarmFill: el('hud-alarm-fill'),
  alarmPct: el('hud-alarm-pct'),
  objective: el('hud-objective'),
  lives: el('hud-lives'),
  smoke: el('hud-smoke'),
  emp: el('hud-emp'),
  toast: el('hud-toast'),
  hint: el('hud-hint'),
};

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = String(Math.floor(t % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

function updateHud() {
  hud.room.textContent = game.room.name;
  hud.loot.textContent = `$${game.loot.toLocaleString('en-US')}`;
  el('hud-loot-total').textContent = `of $${TOTAL_LOOT.toLocaleString('en-US')}`;
  hud.time.textContent = fmtTime(game.time);
  const pct = Math.round(game.alarm.value);
  hud.alarmFill.style.width = `${pct}%`;
  hud.alarmFill.classList.toggle('hot', pct >= 60);
  hud.alarmPct.classList.toggle('hot', pct >= 60);
  hud.alarmPct.textContent = `${pct}%`;
  hud.objective.textContent = `OBJECTIVE: ${game.objective}`;
  hud.lives.textContent = '♥'.repeat(game.lives) + '♡'.repeat(3 - game.lives);
  hud.smoke.textContent = `SMOKE ×${game.smokeLeft}`;
  hud.emp.textContent = `EMP ×${game.empLeft}`;
  // The toast is a gameplay hint: it only ever shows while playing. On
  // the title it would cover the best-take line; on the end screen it
  // would show room one's hint under the getaway.
  if (game.screen === 'playing' && game.toastT > 0 && game.toast) {
    hud.toast.textContent = game.toast;
    hud.toast.style.opacity = '1';
  } else {
    hud.toast.style.opacity = '0';
  }
  // The full-screen end and game-over screens carry their own text; the
  // HUD bars would only repeat stale room numbers over them.
  const chrome = game.screen === 'end' || game.screen === 'gameover' ? 'none' : 'flex';
  el('hud-top').style.display = chrome;
  el('hud-bottom').style.display = chrome;
}

let last = performance.now();
let acc = 0;
const STEP = 1 / 60;
let lastAlarm = 0;
let lastLoot = 0;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;

  // Enter or click starts the run from the title, game-over and end screens.
  const begin = input.pressed('Enter') || input.clicked();
  if (begin && (game.screen === 'title' || game.screen === 'gameover' || game.screen === 'end')) {
    sfx.click();
    game.bestTake = Math.max(game.bestTake, game.finalTake || 0);
    game.startRun();
  }
  if (input.pressed('KeyP') && game.screen === 'playing') {
    game.paused = !game.paused;
  }

  if (!staged) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      game.step(STEP, input);
      input.endStep();
    }
  }

  // Sounds on the changes the player can hear.
  if (game.loot !== lastLoot) {
    if (game.diamondTaken && lastLoot < 50000) sfx.diamond();
    else sfx.pickup();
    lastLoot = game.loot;
  }
  if (game.alarm.value >= 60 && lastAlarm < 60) sfx.spotted();
  lastAlarm = game.alarm.value;
  if (game.screen === 'caught') sfx.caught();

  updateHud();
  render.render(game);
}

requestAnimationFrame(frame);
