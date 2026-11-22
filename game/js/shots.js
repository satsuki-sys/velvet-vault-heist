// shots.js — staged scenes for the maker's screenshots.
// A ?shot= URL picks a room, places the thief and the watchers, sets the
// alarm, and freezes the simulation so the frame is the same every time.
// The picture is still the game itself, rendered by its own code.
//   ?shot=cover  — Room 1, thief mid-gallery, cones sweeping, loot glowing.
//   ?shot=tense  — Room 2, alarm high, a guard closing in, smoke in the air.
//   ?shot=escape — Room 3, thief at the skylight with the take.

import { TOOLS } from './tools.js';

export function applyShotPreset(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;

  if (shot === 'cover') {
    game.loadLevel(0);
    game.screen = 'playing';
    game.thief.x = 470;
    game.thief.y = 400;
    game.thief.facing = -0.5;
    game.thief.coins = 90;
    game.alarm.value = 18;
    const g0 = game.level.guards[0];
    g0.x = 700; g0.y = 150; g0.facing = 2.6; g0.suspicion = 0.2;
    const g1 = game.level.guards[1];
    g1.x = 620; g1.y = 330; g1.facing = 1.57; g1.suspicion = 0;
    game.level.cameras[0].facing = 1.1;
    game.level.cameras[1].facing = 2.2;
    game.elapsed = 47;
  } else if (shot === 'tense') {
    game.loadLevel(1);
    game.screen = 'playing';
    game.thief.x = 640;
    game.thief.y = 330;
    game.thief.facing = -1.2;
    game.thief.coins = 165;
    game.thief.lootTaken = 2;
    game.level.loot[0].taken = true;
    game.level.loot[3].taken = true;
    game.level.vaultDoor.locked = false;
    game.alarm.value = 72;
    const g0 = game.level.guards[0];
    g0.x = 760; g0.y = 380; g0.facing = -1.9; g0.suspicion = 0.85; g0.state = 'stare';
    const g1 = game.level.guards[1];
    g1.x = 480; g1.y = 430; g1.facing = 0.4; g1.suspicion = 0.4;
    game.tools.smokeClouds.push({ x: 560, y: 300, radius: 115, timer: 4.5 });
    game.tools.selected = 0;
    game.elapsed = 154;
  } else if (shot === 'escape') {
    game.loadLevel(2);
    game.screen = 'playing';
    game.thief.x = 640;
    game.thief.y = 198;
    game.thief.facing = -Math.PI / 2;
    game.thief.coins = 320;
    game.thief.lootTaken = 2;
    game.level.loot[0].taken = true;
    game.level.loot[1].taken = true;
    game.alarm.value = 30;
    const g0 = game.level.guards[0];
    g0.x = 300; g0.y = 620; g0.facing = 0.2; g0.suspicion = 0;
    game.level.cameras[0].facing = 0.9;
    game.elapsed = 268;
  } else {
    return false;
  }
  // Freeze the simulation: the frame is staged, the render is live.
  game.shotFrozen = true;
  game.tools.flashes = [];
  return true;
}

export function toolCostList() {
  return TOOLS.map((t) => `${t.name} ${t.cost}`).join(', ');
}
