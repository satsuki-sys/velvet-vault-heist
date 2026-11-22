// main.js — Velvet Vault Heist: boot, loop and the rules that join the parts.
// The game object holds the whole night: the room, the thief, the watchers,
// the alarm, the tools and the screen the player sees. Screens: title,
// playing, caught, levelclear, escaped.

import { ROOM, buildLevels } from './levels.js';
import { makeThief, moveThief, resetThiefPosition } from './thief.js';
import { makeGuard, updateGuard, guardCatchesThief } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeAlarm, updateAlarm } from './alarm.js';
import { makeToolState, selectTool, useTool, updateTools } from './tools.js';
import { grabLoot, exitOpen, thiefAtExit, nearVaultDoor } from './loot.js';
import { makeAudio, bindAudio } from './audio.js';
import { makeInput, bindInput } from './input.js';
import { render } from './render.js';
import { applyShotPreset } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  screen: 'title',
  levelIndex: 0,
  level: null,
  thief: makeThief(70, 640),
  alarm: makeAlarm(),
  tools: makeToolState(),
  elapsed: 0,
  time: 0,
  paused: false,
  caughtBy: '',
  peakAlarm: 0,
  shotFrozen: false,
  coinsAtLevelStart: 50,
  lootAtLevelStart: 0,
};

const audio = bindAudio(makeAudio());
const input = makeInput();
const levelDefs = buildLevels();

// The solids the thief and guards collide with: walls, plus the vault door
// while it is locked.
function solidsFor(level) {
  const solids = [...level.walls];
  if (level.vaultDoor && level.vaultDoor.locked) solids.push(level.vaultDoor);
  return solids;
}

function loadLevel(index) {
  game.levelIndex = index;
  // Fresh copy: a retry must find the loot back on its pedestal.
  const def = JSON.parse(JSON.stringify(levelDefs[index]));
  def.guards = def.guards.map(makeGuard);
  def.cameras = def.cameras.map(makeCamera);
  game.level = def;
  game.alarm = makeAlarm();
  game.tools.smokeClouds = [];
  resetThiefPosition(game.thief, def.start.x, def.start.y);
  game.coinsAtLevelStart = game.thief.coins;
  game.lootAtLevelStart = game.thief.lootTaken;
  game.paused = false;
}

game.loadLevel = loadLevel;

function startGame() {
  game.thief.coins = 50;
  game.thief.lootTaken = 0;
  game.elapsed = 0;
  game.peakAlarm = 0;
  loadLevel(0);
  game.screen = 'playing';
}

function restartLevel() {
  game.thief.coins = game.coinsAtLevelStart;
  game.thief.lootTaken = game.lootAtLevelStart;
  loadLevel(game.levelIndex);
  game.screen = 'playing';
}

function nextLevel() {
  if (game.levelIndex + 1 >= levelDefs.length) {
    game.screen = 'escaped';
    audio.escape();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.screen = 'playing';
}

function onAction(kind, value) {
  if (kind === 'tool') {
    selectTool(game.tools, value);
    return;
  }
  if (kind === 'mute') {
    audio.toggleMute();
    return;
  }
  if (kind === 'pause' && game.screen === 'playing') {
    game.paused = !game.paused;
    return;
  }
  if (kind === 'restart' && (game.screen === 'playing' || game.screen === 'caught' || game.screen === 'escaped')) {
    if (game.screen === 'escaped') startGame();
    else restartLevel();
    return;
  }
  if (kind === 'confirm') {
    if (game.screen === 'title') startGame();
    else if (game.screen === 'levelclear') nextLevel();
    else if (game.screen === 'escaped') startGame();
  }
}

bindInput(canvas, input, onAction);

function update(dt) {
  if (game.shotFrozen || game.paused || game.screen !== 'playing') return;
  game.elapsed += dt;
  const level = game.level;
  const thief = game.thief;
  const solids = solidsFor(level);
  const sightWalls = level.walls.filter((w) => w.kind !== 'planter');

  // Mouse: a click on the title starts the job; a click in a room walks.
  if (input.click) {
    thief.clickTarget = { x: input.click.x, y: input.click.y };
    input.click = null;
  }

  // Working a locked vault door: stand still and let the channel run.
  if (thief.channeling === 'vault') {
    const still = !input.left && !input.right && !input.up && !input.down;
    if (!still || !nearVaultDoor(level, thief)) {
      thief.channeling = null;
      level.vaultDoor.channel = 0;
    } else {
      level.vaultDoor.channel += dt / 2.5;
      if (level.vaultDoor.channel >= 1) {
        level.vaultDoor.locked = false;
        level.vaultDoor.channel = 0;
        thief.channeling = null;
        audio.unlock();
      }
    }
  } else {
    moveThief(thief, input, dt, solids, ROOM);
  }

  // E: lift loot, or start working a locked door.
  if (input.interactPressed) {
    input.interactPressed = false;
    const piece = grabLoot(level, thief, audio);
    if (piece) {
      // The take grows; nothing else to do this press.
    } else if (level.vaultDoor && level.vaultDoor.locked && nearVaultDoor(level, thief)) {
      thief.channeling = 'vault';
    }
  }

  // Space: use the selected tool.
  if (input.usePressed) {
    input.usePressed = false;
    useTool(game.tools, thief, level, audio);
  }

  updateTools(game.tools, dt);

  // The watchers: guards patrol, stare and chase; cameras sweep.
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of level.guards) {
    const sees = updateGuard(guard, thief, sightWalls, solids, ROOM, dt);
    if (sees) seenByGuard = true;
    if (guardCatchesThief(guard, thief)) {
      game.screen = 'caught';
      game.caughtBy = guard.name;
      audio.caught();
      return;
    }
  }
  for (const camera of level.cameras) {
    if (updateCamera(camera, thief, sightWalls, game.tools.smokeClouds, game.time, dt)) {
      seenByCamera = true;
    }
  }

  updateAlarm(game.alarm, seenByGuard, seenByCamera, thief.sneaking, dt);
  game.peakAlarm = Math.max(game.peakAlarm, game.alarm.value);

  // A guard who just spotted her earns a soft warning blip.
  if (seenByGuard && !game._warned) audio.spotted();
  game._warned = seenByGuard;

  // The way out, once the take is enough.
  if (exitOpen(level) && thiefAtExit(level, thief)) {
    if (game.levelIndex + 1 >= levelDefs.length) {
      game.screen = 'escaped';
      audio.escape();
    } else {
      game.screen = 'levelclear';
      audio.escape();
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.time += dt;
  update(dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}

// A staged screenshot (?shot=cover|tense|escape) loads its room first.
const params = new URLSearchParams(window.location.search);
if (!applyShotPreset(game, params)) {
  loadLevel(0);
}

// Clicking the title card begins the job.
canvas.addEventListener('mousedown', () => {
  if (game.screen === 'title') startGame();
});

// For play-testing and screenshots: the live state, nothing more.
window.__velvet = {
  game,
  startGame,
  loadLevel,
  nextLevel,
  restartLevel,
  input,
};

requestAnimationFrame(frame);
