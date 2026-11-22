// Input: the keyboard set, edge-triggered presses, and the mouse.
// The game reads held keys every step and pressed keys once; the mouse
// gives a world position for a thrown smoke bomb.

import { WORLD } from './tune.js';

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressedKeys = new Set();
    this.mouse = { x: WORLD.w / 2, y: WORLD.h / 2, clicked: false, clickX: 0, clickY: 0 };
    this.view = { x: 0, y: 0, scale: 1 };
    this.onFirstGesture = null;
    this.gestureDone = false;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressedKeys.add(e.code);
      this.keys.add(e.code);
      this.gesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressedKeys.clear();
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left - this.view.x) / this.view.scale;
      this.mouse.y = (e.clientY - r.top - this.view.y) / this.view.scale;
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = (e.clientX - r.left - this.view.x) / this.view.scale;
      this.mouse.clickY = (e.clientY - r.top - this.view.y) / this.view.scale;
      this.mouse.clicked = true;
      this.gesture();
    });
  }

  gesture() {
    if (!this.gestureDone && this.onFirstGesture) {
      this.gestureDone = true;
      this.onFirstGesture();
    }
  }

  held(code) {
    return this.keys.has(code);
  }

  /** True once, on the step right after the key went down. */
  pressed(code) {
    return this.pressedKeys.has(code);
  }

  /** True once, on the step right after a mouse click. */
  clicked() {
    return this.mouse.clicked;
  }

  /** Where a smoke bomb lands when thrown with Q: toward the mouse, near the thief. */
  smokeTarget(thief) {
    const dx = this.mouse.x - thief.x;
    const dy = this.mouse.y - thief.y;
    const d = Math.hypot(dx, dy) || 1;
    const reach = Math.min(d, 260);
    return { x: thief.x + (dx / d) * reach, y: thief.y + (dy / d) * reach };
  }

  /** Where a smoke bomb lands when thrown with a click: at the click. */
  clickTarget(thief) {
    const dx = this.mouse.clickX - thief.x;
    const dy = this.mouse.clickY - thief.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d <= 260) return { x: this.mouse.clickX, y: this.mouse.clickY };
    return { x: thief.x + (dx / d) * 260, y: thief.y + (dy / d) * 260 };
  }

  /** Clear the one-shot presses and clicks after each step. */
  endStep() {
    this.pressedKeys.clear();
    this.mouse.clicked = false;
  }
}
