// cameras.js — the wall cameras: fixed eyes that sweep their cones.
// A camera's cone is longer than a guard's (230 px) and narrower. It cannot
// catch the thief itself, but every second it watches her the alarm climbs.
// An EMP pulse switches a camera off for a while; smoke blinds it too.

import { insideCone, lineOfSight } from './vision.js';

export const CAMERA_RANGE = 230;
export const CAMERA_HALF_ANGLE = 0.35; // ~20 degrees each side

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    speed: def.speed,
    phase: def.phase,
    facing: def.base,
    offTimer: 0, // EMP
    blindTimer: 0, // smoke
    watching: false,
  };
}

export function updateCamera(camera, thief, walls, smokeClouds, time, dt) {
  if (camera.offTimer > 0) camera.offTimer -= dt;
  if (camera.blindTimer > 0) camera.blindTimer -= dt;
  camera.facing = camera.base + Math.sin(time * camera.speed + camera.phase) * camera.sweep;

  if (camera.offTimer > 0 || camera.blindTimer > 0) {
    camera.watching = false;
    return false;
  }
  const inSmoke = smokeClouds.some(
    (c) => Math.hypot(thief.x - c.x, thief.y - c.y) < c.radius,
  );
  if (inSmoke) {
    camera.watching = false;
    return false;
  }
  const sees =
    insideCone(camera.x, camera.y, camera.facing, CAMERA_RANGE, CAMERA_HALF_ANGLE, thief.x, thief.y) &&
    lineOfSight(camera.x, camera.y, thief.x, thief.y, walls);
  camera.watching = sees;
  return sees;
}
