// guards.js — the night watch: patrol, suspicion, chase and capture.
// A guard walks a loop of waypoints, pausing at each, facing where he walks.
// His vision cone is 190 px long and 48 degrees wide. When the thief is inside
// it and in plain sight, suspicion grows; at full suspicion he gives chase.
// A chase lasts until he loses the thief for two seconds. Touching the thief
// while suspicious is a fair catch: the thief had a warning, an exclamation
// mark and a grace moment first.

import { insideCone, lineOfSight, angleDiff, distance, slideMove, clamp } from './vision.js';

export const GUARD_RANGE = 190;
export const GUARD_HALF_ANGLE = 0.42; // ~24 degrees each side
export const CATCH_RADIUS = 26;
export const SUSPICION_TIME = 0.9; // seconds of being seen before the chase

export function makeGuard(def) {
  return {
    name: def.name,
    x: def.x,
    y: def.y,
    speed: def.speed,
    pause: def.pause,
    waypoints: def.waypoints,
    leg: 0,
    waiting: 0,
    facing: Math.PI / 2,
    suspicion: 0,
    state: 'patrol', // patrol | stare | chase | confused
    chaseTimer: 0,
    lostTimer: 0,
    targetX: def.x,
    targetY: def.y,
    blindTimer: 0, // smoke in the eyes
  };
}

// Can this guard see the thief right now?
export function guardSeesThief(guard, thief, walls) {
  if (guard.blindTimer > 0) return false;
  if (!insideCone(guard.x, guard.y, guard.facing, GUARD_RANGE, GUARD_HALF_ANGLE, thief.x, thief.y)) return false;
  return lineOfSight(guard.x, guard.y, thief.x, thief.y, walls);
}

export function updateGuard(guard, thief, walls, solids, room, dt) {
  if (guard.blindTimer > 0) guard.blindTimer -= dt;

  const sees = guardSeesThief(guard, thief, walls);

  if (guard.state === 'chase') {
    if (sees) {
      guard.lostTimer = 0;
      guard.targetX = thief.x;
      guard.targetY = thief.y;
    } else {
      guard.lostTimer += dt;
      if (guard.lostTimer > 2) {
        guard.state = 'confused';
        guard.suspicion = 0.4;
        guard.chaseTimer = 0;
      }
    }
    walkToward(guard, guard.targetX, guard.targetY, guard.speed * 1.55, solids, room, dt);
    guard.chaseTimer += dt;
    if (guard.chaseTimer > 6) {
      guard.state = 'confused';
      guard.suspicion = 0.4;
      guard.chaseTimer = 0;
    }
    return sees;
  }

  if (sees) {
    // Spotted: stand, stare, and let suspicion climb. Sneaking buys time.
    guard.state = 'stare';
    guard.facing = Math.atan2(thief.y - guard.y, thief.x - guard.x);
    const rate = thief.sneaking ? 0.55 : 1;
    guard.suspicion += (dt / SUSPICION_TIME) * rate;
    if (guard.suspicion >= 1) {
      guard.state = 'chase';
      guard.chaseTimer = 0;
      guard.lostTimer = 0;
      guard.targetX = thief.x;
      guard.targetY = thief.y;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.7);
    if (guard.state === 'stare') guard.state = 'patrol';
    if (guard.state === 'confused') {
      guard.suspicion = Math.max(0, guard.suspicion - dt * 0.5);
      if (guard.suspicion <= 0) guard.state = 'patrol';
    }
    if (guard.state === 'patrol') patrolStep(guard, solids, room, dt);
  }
  return sees;
}

function patrolStep(guard, solids, room, dt) {
  if (guard.waiting > 0) {
    guard.waiting -= dt;
    return;
  }
  const [wx, wy] = guard.waypoints[guard.leg];
  const arrived = walkToward(guard, wx, wy, guard.speed, solids, room, dt);
  if (arrived) {
    guard.leg = (guard.leg + 1) % guard.waypoints.length;
    guard.waiting = guard.pause;
  }
}

// Walk toward (tx, ty). Returns true when the guard arrives.
function walkToward(guard, tx, ty, speed, solids, room, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  const step = Math.min(dist, speed * dt);
  const nx = (dx / dist) * step;
  const ny = (dy / dist) * step;
  guard.facing = Math.atan2(ny, nx);
  const next = slideMove(guard.x, guard.y, 14, nx, ny, solids);
  guard.x = clamp(next.x, room.x + 14, room.x + room.w - 14);
  guard.y = clamp(next.y, room.y + 14, room.y + room.h - 14);
  return dist - step < 6;
}

export function guardCatchesThief(guard, thief) {
  if (guard.state !== 'chase' && guard.suspicion < 0.99) return false;
  return distance(guard.x, guard.y, thief.x, thief.y) < CATCH_RADIUS;
}
