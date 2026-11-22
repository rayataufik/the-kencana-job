// input.js — keyboard state. WASD / arrows to move, Shift to sneak,
// Enter to start, R to restart, M to mute. Mouse click focuses the canvas.

export const keys = {};

export function initInput(onFirstGesture) {
  let gestured = false;
  const gesture = () => {
    if (!gestured) {
      gestured = true;
      if (onFirstGesture) onFirstGesture();
    }
  };
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    gesture();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('mousedown', gesture);
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function sneaking() {
  return !!(keys.ShiftLeft || keys.ShiftRight);
}

export function pressed(code) {
  if (keys[code]) {
    keys[code] = false;
    return true;
  }
  return false;
}
