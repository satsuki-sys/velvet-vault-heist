// input.js — keyboard and mouse, kept in one small place.
// WASD or arrows walk, Shift sneaks, E grabs, Space uses a tool,
// 1/2/3 pick a tool, R restarts the room, P pauses, M mutes.
// Clicking the floor sets a walk target; clicking a button presses it.

export function makeInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    interactPressed: false, // E, edge-triggered by the game loop
    usePressed: false, // Space, edge-triggered
    click: null, // {x, y} in canvas pixels, consumed by the game loop
    keys: new Set(),
  };
}

const KEY_MAP = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
};

export function bindInput(canvas, input, onAction) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const dir = KEY_MAP[event.code];
    if (dir) {
      input[dir] = true;
      input.keys.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sneak = true;
    if (event.code === 'KeyE') input.interactPressed = true;
    if (event.code === 'Space') { input.usePressed = true; event.preventDefault(); }
    if (event.code === 'Digit1') onAction('tool', 0);
    if (event.code === 'Digit2') onAction('tool', 1);
    if (event.code === 'Digit3') onAction('tool', 2);
    if (event.code === 'KeyR') onAction('restart');
    if (event.code === 'KeyP') onAction('pause');
    if (event.code === 'KeyM') onAction('mute');
    if (event.code === 'Enter') onAction('confirm');
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEY_MAP[event.code];
    if (dir) {
      input.keys.delete(event.code);
      const stillHeld = [...input.keys].some((code) => KEY_MAP[code] === dir);
      if (!stillHeld) input[dir] = false;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sneak = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.click = { x, y };
  });
}
