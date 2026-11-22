// render.js — everything the eye sees: the room, the cones, the people,
// the loot, the alarm meter and the screens between rooms.
// One canvas, 1280 by 720. The HUD lives in the top 76 px; the room below.

import { ROOM } from './levels.js';
import { TOOLS } from './tools.js';
import { alarmLevel } from './alarm.js';
import { lootTakenCount, exitOpen } from './loot.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guards.js';
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './cameras.js';

const W = 1280;
const H = 720;

export function render(ctx, game) {
  drawBackdrop(ctx);
  drawHud(ctx, game);
  drawRoom(ctx, game);
  if (game.screen === 'title') drawTitleScreen(ctx, game);
  if (game.screen === 'caught') drawCaughtScreen(ctx, game);
  if (game.screen === 'levelclear') drawLevelClearScreen(ctx, game);
  if (game.screen === 'escaped') drawEscapedScreen(ctx, game);
  if (game.paused && game.screen === 'playing') drawPausedNote(ctx);
}

function drawBackdrop(ctx) {
  ctx.fillStyle = '#0b0b16';
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- HUD

function drawHud(ctx, game) {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, 76);
  ctx.fillStyle = '#6b5a2e';
  ctx.fillRect(0, 76, W, 2);

  // Title and room name.
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('VELVET VAULT HEIST', 20, 30);
  ctx.fillStyle = '#b9a86f';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(game.level.name, 20, 52);

  drawAlarmMeter(ctx, game);
  drawToolSlots(ctx, game);
  drawScoreBits(ctx, game);
}

function drawAlarmMeter(ctx, game) {
  const x = 400;
  const y = 20;
  const w = 250;
  const level = alarmLevel(game.alarm);
  ctx.fillStyle = '#b9a86f';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', x, y - 6);
  ctx.fillStyle = '#1c1c30';
  ctx.fillRect(x, y, w, 18);
  const frac = game.alarm.value / 100;
  ctx.fillStyle = level === 'LOCKDOWN' ? '#ff2e2e' : level === 'HOT' ? '#ff7a2e' : level === 'WARM' ? '#e8c96a' : '#4caf6d';
  ctx.fillRect(x, y, w * frac, 18);
  ctx.strokeStyle = '#6b5a2e';
  ctx.strokeRect(x, y, w, 18);
  ctx.fillStyle = level === 'LOCKDOWN' ? '#ff6b6b' : '#e8ddc0';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(level, x + w + 10, y + 14);
  if (game.alarm.lockdown > 0) {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(`LOCKDOWN ${Math.ceil(game.alarm.lockdown)}s`, x, y + 34);
  }
}

function drawToolSlots(ctx, game) {
  let x = 760;
  TOOLS.forEach((tool, i) => {
    const selected = game.tools.selected === i;
    ctx.fillStyle = selected ? '#3a2f10' : '#171726';
    ctx.fillRect(x, 12, 92, 50);
    ctx.strokeStyle = selected ? '#e8c96a' : '#4a4a66';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x, 12, 92, 50);
    ctx.fillStyle = '#e8c96a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${tool.key}] ${tool.name}`, x + 6, 29);
    ctx.fillStyle = game.thief.coins >= tool.cost ? '#e8ddc0' : '#8a6a6a';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`◉ ${tool.cost} coins`, x + 6, 48);
    x += 100;
  });
}

function drawScoreBits(ctx, game) {
  const taken = lootTakenCount(game.level);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8ddc0';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(`Loot ${taken}/${game.level.requiredLoot}  ◉ ${game.thief.coins}`, 1260, 30);
  ctx.fillStyle = '#b9a86f';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`Time ${formatTime(game.elapsed)}`, 1260, 52);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------- room

function drawRoom(ctx, game) {
  const level = game.level;
  drawFloor(ctx);
  drawCarpet(ctx);
  drawPatrolPaths(ctx, level);
  drawCones(ctx, game);
  drawWalls(ctx, level);
  drawVaultDoor(ctx, level);
  drawExit(ctx, game);
  drawLoot(ctx, game);
  drawSmoke(ctx, game);
  drawCameras(ctx, level);
  drawGuards(ctx, level);
  drawThief(ctx, game);
  drawFlashes(ctx, game);
  drawHints(ctx, game);
}

function drawFloor(ctx) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Marble tiles.
  ctx.strokeStyle = '#23233a';
  ctx.lineWidth = 1;
  for (let x = ROOM.x + 62; x < ROOM.x + ROOM.w; x += 62) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke();
  }
  for (let y = ROOM.y + 62; y < ROOM.y + ROOM.h; y += 62) {
    ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke();
  }
  // Warm pools of light from the ceiling lamps.
  ctx.fillStyle = 'rgba(232, 201, 106, 0.05)';
  for (const [lx, ly] of [[320, 240], [960, 240], [320, 560], [960, 560], [640, 400]]) {
    ctx.beginPath(); ctx.arc(lx, ly, 130, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCarpet(ctx) {
  ctx.fillStyle = '#4a1622';
  ctx.fillRect(ROOM.x + 90, ROOM.y + 250, ROOM.w - 180, 110);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 90, ROOM.y + 250, ROOM.w - 180, 110);
}

function drawPatrolPaths(ctx, level) {
  ctx.strokeStyle = 'rgba(232, 221, 192, 0.14)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  for (const g of level.guards) {
    ctx.beginPath();
    g.waypoints.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCone(ctx, x, y, facing, range, halfAngle, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawCones(ctx, game) {
  for (const camera of game.level.cameras) {
    if (camera.offTimer > 0) continue;
    const hot = camera.watching;
    drawCone(ctx, camera.x, camera.y, camera.facing, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      hot ? 'rgba(255, 60, 60, 0.34)' : 'rgba(255, 70, 70, 0.15)');
  }
  for (const guard of game.level.guards) {
    if (guard.blindTimer > 0) continue;
    const hot = guard.suspicion > 0.25 || guard.state === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_RANGE, GUARD_HALF_ANGLE,
      hot ? 'rgba(255, 60, 60, 0.30)' : 'rgba(255, 210, 80, 0.18)');
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    if (w.kind === 'case') {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#8a6d2f';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(w.x + 8, w.y + 8, w.w - 16, 4);
    } else if (w.kind === 'planter') {
      ctx.fillStyle = '#2e5d3a';
      ctx.beginPath(); ctx.arc(w.x + 23, w.y + 23, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3f7a4e';
      ctx.beginPath(); ctx.arc(w.x + 23, w.y + 23, 12, 0, Math.PI * 2); ctx.fill();
    } else if (w.kind === 'vault') {
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(w.x, w.y, w.w, 3);
    } else {
      ctx.fillStyle = '#3a3a55';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#8a6d2f';
      if (w.h <= 14) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
      if (w.w <= 14) ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
    }
  }
}

function drawVaultDoor(ctx, level) {
  const door = level.vaultDoor;
  if (!door) return;
  if (door.locked) {
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT — hold E or use a lockpick', door.x + door.w / 2, door.y - 8);
    if (door.channel > 0) {
      ctx.fillStyle = '#37d67a';
      ctx.fillRect(door.x, door.y - 4, door.w * door.channel, 3);
    }
  } else {
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT OPEN', door.x + door.w / 2, door.y - 8);
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = exitOpen(game.level);
  ctx.fillStyle = open ? '#1d7a44' : '#243024';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#37d67a' : '#5a6a5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? '#b8ffd0' : '#8aa08a';
  ctx.font = 'bold 11px Georgia, serif';
  // An exit near the east wall right-aligns its labels so none is clipped.
  const nearRight = e.x + e.w / 2 > 1100;
  ctx.textAlign = nearRight ? 'right' : 'center';
  const labelX = nearRight ? 1250 : e.x + e.w / 2;
  const label = open ? 'EXIT ✓' : `NEED ${game.level.requiredLoot - lootTakenCount(game.level)} MORE`;
  ctx.fillText(e.label, labelX, e.y - 8);
  ctx.fillText(label, labelX, e.y + e.h + 16);
  if (open) {
    const pulse = 0.5 + Math.sin(game.time * 4) * 0.3;
    ctx.strokeStyle = `rgba(55, 214, 122, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - 5, e.y - 5, e.w + 10, e.h + 10);
  }
}

function drawLoot(ctx, game) {
  for (const item of game.level.loot) {
    if (item.taken) continue;
    const near = Math.hypot(game.thief.x - item.x, game.thief.y - item.y) < 60;
    const pulse = 0.6 + Math.sin(game.time * 3 + item.x) * 0.25;
    ctx.fillStyle = `rgba(242, 193, 78, ${near ? 0.35 : 0.18 * pulse})`;
    ctx.beginPath(); ctx.arc(item.x, item.y, 30, 0, Math.PI * 2); ctx.fill();
    if (item.kind === 'painting') {
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(item.x - 26, item.y - 18, 52, 36);
      ctx.fillStyle = '#7a4a8a';
      ctx.fillRect(item.x - 21, item.y - 13, 42, 26);
      ctx.fillStyle = '#e8c96a';
      ctx.beginPath(); ctx.arc(item.x, item.y - 2, 6, 0, Math.PI * 2); ctx.fill();
    } else if (item.kind === 'gem') {
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16); ctx.lineTo(item.x + 13, item.y);
      ctx.lineTo(item.x, item.y + 16); ctx.lineTo(item.x - 13, item.y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(item.x - 4, item.y - 5, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(item.x - 16, item.y - 6, 32, 12);
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(item.x - 16, item.y - 6, 32, 4);
    }
    if (near) {
      ctx.fillStyle = '#e8ddc0';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`E — ${item.name} (◉ ${item.coins})`, item.x, item.y - 34);
    }
  }
}

function drawSmoke(ctx, game) {
  for (const cloud of game.tools.smokeClouds) {
    ctx.fillStyle = `rgba(180, 180, 190, ${0.35 * (cloud.timer / 4.5)})`;
    ctx.beginPath(); ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cloud.x - 40, cloud.y + 20, cloud.radius * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cloud.x + 45, cloud.y - 15, cloud.radius * 0.55, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCameras(ctx, level) {
  for (const camera of level.cameras) {
    const off = camera.offTimer > 0;
    ctx.fillStyle = off ? '#3a3a44' : '#22222e';
    ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.strokeStyle = off ? '#55555f' : '#8a8a9a';
    ctx.lineWidth = 1;
    ctx.strokeRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.fillStyle = camera.watching ? '#ff2e2e' : off ? '#55555f' : '#ff5a5a';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2); ctx.fill();
    if (camera.watching) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', camera.x, camera.y - 16);
    }
  }
}

function drawGuards(ctx, level) {
  for (const guard of level.guards) {
    // Body: navy uniform.
    ctx.fillStyle = '#2b3a67';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2); ctx.fill();
    // Cap brim shows facing.
    ctx.fillStyle = '#1c2745';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 8, guard.y + Math.sin(guard.facing) * 8, 6, 0, Math.PI * 2);
    ctx.fill();
    // Belt dot.
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, 3, 0, Math.PI * 2); ctx.fill();
    // Name and warning.
    ctx.fillStyle = '#c9c9d9';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 26);
    if (guard.state === 'chase' || guard.suspicion > 0.25) {
      ctx.fillStyle = guard.state === 'chase' ? '#ff2e2e' : '#ffb02e';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.fillText('!', guard.x, guard.y - 20);
    }
    if (guard.blindTimer > 0) {
      ctx.fillStyle = '#e8ddc0';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('?', guard.x, guard.y - 20);
    }
  }
}

function drawThief(ctx, game) {
  const t = game.thief;
  // Velvet cloak.
  ctx.fillStyle = '#7b4fd0';
  ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a2d85';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.stroke();
  // Hood and mask.
  ctx.fillStyle = '#2b1a4a';
  ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8ddc0';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.facing) * 4, t.y + Math.sin(t.facing) * 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Sneak: a soft ring shows she is quiet.
  if (t.sneaking) {
    ctx.strokeStyle = 'rgba(123, 79, 208, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.radius + 6, 0, Math.PI * 2); ctx.stroke();
  }
  // Click target marker.
  if (t.clickTarget) {
    ctx.strokeStyle = 'rgba(232, 221, 192, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.clickTarget.x, t.clickTarget.y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(t.clickTarget.x - 9, t.clickTarget.y); ctx.lineTo(t.clickTarget.x + 9, t.clickTarget.y);
    ctx.moveTo(t.clickTarget.x, t.clickTarget.y - 9); ctx.lineTo(t.clickTarget.x, t.clickTarget.y + 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8ddc0';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vesper', t.x, t.y + 28);
}

function drawFlashes(ctx, game) {
  game.tools.flashes.forEach((flash, i) => {
    ctx.fillStyle = 'rgba(13, 13, 26, 0.85)';
    const w = ctx.measureText(flash.text).width + 30;
    ctx.fillRect(W / 2 - w / 2, 96 + i * 30, w, 24);
    ctx.fillStyle = '#e8c96a';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(flash.text, W / 2, 96 + i * 30 + 17);
  });
}

function drawHints(ctx, game) {
  if (game.screen !== 'playing' || game.elapsed > 14) return;
  ctx.fillStyle = 'rgba(232, 221, 192, 0.85)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.level.intro, W / 2, 690);
}

// ---------------------------------------------------------------- screens

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(11, 11, 22, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawTitleScreen(ctx, game) {
  ctx.fillStyle = 'rgba(11, 11, 22, 0.72)';
  ctx.fillRect(0, 76, W, H - 76);
  panel(ctx, 290, 130, 700, 460);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText('VELVET VAULT HEIST', 640, 200);
  ctx.fillStyle = '#e8ddc0';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('Three rooms. One quiet burglar. No alarms, if you are lucky.', 640, 236);
  ctx.font = '15px Georgia, serif';
  const lines = [
    'You are Vesper, a thief in a velvet cloak. Lift the loot, mind the cones,',
    'and slip out the green door before the alarm wakes the whole house.',
    '',
    'WASD / arrows — walk      Shift — sneak      Click — walk there',
    'E — lift loot / work a lock      1 / 2 / 3 — pick a tool      Space — use it',
    'Smoke Bomb ◉25 · EMP Pulse ◉40 · Lockpick ◉30 — tools cost stolen coins.',
    'Yellow cones are guards, red cones are cameras. Fill the alarm and the',
    'house locks down. A guard who touches you while chasing ends the night.',
    '',
    'Three rooms stand between you and the skylight. Steal well.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 272 + i * 24));
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('Press Enter or click to begin', 640, 556);
}

function drawCaughtScreen(ctx, game) {
  ctx.fillStyle = 'rgba(40, 8, 8, 0.6)';
  ctx.fillRect(0, 76, W, H - 76);
  panel(ctx, 390, 220, 500, 260);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText('BUSTED!', 640, 290);
  ctx.fillStyle = '#e8ddc0';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`${game.caughtBy} caught Vesper with ${game.thief.lootTaken} piece(s) in hand.`, 640, 330);
  ctx.fillText(`The house keeps its ${game.thief.coins} coins — this time.`, 640, 356);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('Press R to try the room again', 640, 430);
}

function drawLevelClearScreen(ctx, game) {
  ctx.fillStyle = 'rgba(11, 11, 22, 0.6)';
  ctx.fillRect(0, 76, W, H - 76);
  panel(ctx, 390, 220, 500, 260);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('ROOM CLEARED', 640, 290);
  ctx.fillStyle = '#e8ddc0';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Loot lifted: ${game.thief.lootTaken} piece(s) · Coins: ◉ ${game.thief.coins}`, 640, 330);
  ctx.fillText(`Alarm peaked at ${Math.round(game.peakAlarm)}% · Lockdowns: ${game.alarm.lockdowns}`, 640, 356);
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('Press Enter for the next room', 640, 430);
}

function drawEscapedScreen(ctx, game) {
  ctx.fillStyle = 'rgba(11, 11, 22, 0.72)';
  ctx.fillRect(0, 76, W, H - 76);
  panel(ctx, 330, 150, 620, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY', 640, 220);
  ctx.fillStyle = '#e8ddc0';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('Vesper melts into the night with the velvet still on her shoulders.', 640, 256);
  ctx.font = '16px Georgia, serif';
  const lines = [
    `Pieces stolen: ${game.thief.lootTaken}   ·   Coins: ◉ ${game.thief.coins}`,
    `Time: ${formatTime(game.elapsed)}   ·   Alarm peaked at ${Math.round(game.peakAlarm)}%`,
    `Lockdowns survived: ${game.alarm.lockdowns}`,
    '',
    game.peakAlarm < 35 ? 'Rating: GHOST — the house never knew she was there.' :
      game.peakAlarm < 75 ? 'Rating: SMOOTH — a few raised eyebrows, nothing more.' :
        'Rating: LOUD LEGEND — the whole house woke up, and she still left.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 300 + i * 28));
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('Press R to run the job again', 640, 500);
}

function drawPausedNote(ctx) {
  ctx.fillStyle = 'rgba(13, 13, 26, 0.85)';
  ctx.fillRect(560, 330, 160, 40);
  ctx.fillStyle = '#e8c96a';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED — press P', 640, 355);
}
