// loot.js — the take: paintings, gems and gold, and the way out.
// A piece is lifted by standing close and pressing E. When the required
// number is lifted, the exit glows green and the thief can leave.

import { distance } from './vision.js';

export const LOOT_RADIUS = 46;

export function lootTakenCount(level) {
  return level.loot.filter((l) => l.taken).length;
}

export function lootRemaining(level) {
  return level.loot.filter((l) => !l.taken);
}

export function nearestLoot(level, thief) {
  let best = null;
  let bestDist = Infinity;
  for (const item of level.loot) {
    if (item.taken) continue;
    const d = distance(thief.x, thief.y, item.x, item.y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best && bestDist <= LOOT_RADIUS ? best : null;
}

// Lift the nearest piece, if one is in reach. Returns the piece or null.
export function grabLoot(level, thief, audio) {
  const item = nearestLoot(level, thief);
  if (!item) return null;
  item.taken = true;
  thief.coins += item.coins;
  thief.lootTaken += 1;
  audio.pickup();
  return item;
}

export function exitOpen(level) {
  return lootTakenCount(level) >= level.requiredLoot;
}

export function thiefAtExit(level, thief) {
  const e = level.exit;
  return (
    thief.x > e.x - 6 && thief.x < e.x + e.w + 6 &&
    thief.y > e.y - 6 && thief.y < e.y + e.h + 6
  );
}

// Is the thief close enough to the vault door to work on it?
export function nearVaultDoor(level, thief) {
  if (!level.vaultDoor) return false;
  const d = level.vaultDoor;
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  return distance(thief.x, thief.y, cx, cy) < 70;
}
