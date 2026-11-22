// Keyboard and mouse input for The Marlowe Job.
// Keys are read as a held set; the mouse gives a position in canvas pixels and
// a click queue (one entry per click, consumed by the game). A key tap is never
// lost between frames: keydown records it in `struck`, and the game consumes it
// with pressed(); leftovers are cleared once per animation frame.

export function createInput(canvas) {
  const keys = new Set();
  const struck = new Set();
  const clicks = [];
  let mouse = { x: 0, y: 0 };

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
    KeyQ: 'smoke',
    KeyR: 'emp',
    Enter: 'confirm',
    Space: 'confirm',
    KeyP: 'pause',
    Escape: 'pause',
  };

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action || event.repeat) return;
    if (action === 'confirm' || action === 'pause') event.preventDefault();
    keys.add(action);
    struck.add(action);
  }
  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }
  function onClick(event) {
    onMouseMove(event);
    clicks.push({ x: mouse.x, y: mouse.y });
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);

  return {
    held(action) { return keys.has(action); },
    /** True once per key tap, even a tap shorter than one frame. */
    pressed(action) {
      if (struck.has(action)) { struck.delete(action); return true; }
      return false;
    },
    /** Call once per animation frame, after the updates, to drop stale taps. */
    endFrame() { struck.clear(); },
    axis() {
      let x = 0; let y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    mouse() { return mouse; },
    /** Drain queued clicks; each click is reported once. */
    drainClicks() { return clicks.splice(0, clicks.length); },
  };
}
