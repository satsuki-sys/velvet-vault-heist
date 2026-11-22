// thief.js — the burglar: where she stands, how she moves, what she carries.
// She is a circle of radius 14. She walks at 175 px/s, sneaks at 95 px/s.
// Sneaking halves how fast she is noticed. She can carry coins and tools.

import { slideMove, clamp } from './vision.js';

export const THIEF_RADIUS = 14;
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 95;

export function makeThief(x, y) {
  return {
    x, y,
    radius: THIEF_RADIUS,
    facing: -Math.PI / 2,
    moving: false,
    sneaking: false,
    coins: 50,
    lootTaken: 0,
    channeling: null, // 'vault' while she works a locked door
    channelProgress: 0,
    clickTarget: null, // {x, y} set by a mouse click
    caught: false,
  };
}

export function resetThiefPosition(thief, x, y) {
  thief.x = x;
  thief.y = y;
  thief.facing = -Math.PI / 2;
  thief.clickTarget = null;
  thief.channeling = null;
  thief.channelProgress = 0;
}

// Read the keys and the click target, then move. Returns nothing; the thief
// object is updated in place.
export function moveThief(thief, input, dt, solids, room) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  // Click-to-move: walk toward the clicked point until close, unless the
  // player steers with keys instead.
  if (dx === 0 && dy === 0 && thief.clickTarget) {
    const tx = thief.clickTarget.x - thief.x;
    const ty = thief.clickTarget.y - thief.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 10) {
      thief.clickTarget = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  } else if (dx !== 0 || dy !== 0) {
    thief.clickTarget = null;
  }

  const len = Math.hypot(dx, dy);
  thief.moving = len > 0;
  if (!thief.moving) return;

  thief.sneaking = input.sneak;
  const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const stepX = (dx / len) * speed * dt;
  const stepY = (dy / len) * speed * dt;
  thief.facing = Math.atan2(stepY, stepX);

  const next = slideMove(thief.x, thief.y, thief.radius, stepX, stepY, solids);
  thief.x = clamp(next.x, room.x + thief.radius, room.x + room.w - thief.radius);
  thief.y = clamp(next.y, room.y + thief.radius, room.y + room.h - thief.radius);
}
