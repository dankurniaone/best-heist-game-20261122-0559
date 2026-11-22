// Boot for The Marlowe Job: wire the canvas, input, audio and game together
// and run the fixed-step loop. A ?shot= query stages one fixed scene instead
// (see shots.js) so screenshots are deterministic renders of the real game.

import { VIEW, STEP } from './config.js';
import { createGame, update } from './game.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const game = createGame();
const input = createInput(canvas);
const audio = createAudio();
// Debug handle for play-testing (read-only inspection from the console).
window.__game = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
} else {
  game.screen = 'title';
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shot) {
    accumulator += dt;
    while (accumulator >= STEP) {
      update(game, input, audio, STEP);
      accumulator -= STEP;
    }
    input.endFrame();
  }
  render(ctx, game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
