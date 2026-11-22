// tools.js — the burglar's kit: three tools, each bought with stolen coins.
// Smoke blinds every eye in its cloud. EMP sleeps the cameras. A lockpick
// opens a locked door at once instead of a long, loud channel.

export const TOOLS = [
  {
    id: 'smoke',
    key: '1',
    name: 'Smoke Bomb',
    cost: 25,
    blurb: 'A grey cloud. Eyes cannot see through it.',
  },
  {
    id: 'emp',
    key: '2',
    name: 'EMP Pulse',
    cost: 40,
    blurb: 'Cameras sleep for six seconds.',
  },
  {
    id: 'lockpick',
    key: '3',
    name: 'Lockpick',
    cost: 30,
    blurb: 'Opens a locked door at once.',
  },
];

export function makeToolState() {
  return {
    selected: 0, // index into TOOLS
    smokeClouds: [], // {x, y, radius, timer}
    flashes: [], // one-line messages for the HUD: {text, timer}
  };
}

export function selectTool(tools, index) {
  if (index >= 0 && index < TOOLS.length) tools.selected = index;
}

// Spend the selected tool. Returns true when it went off.
export function useTool(tools, thief, level, audio) {
  const tool = TOOLS[tools.selected];
  if (thief.coins < tool.cost) {
    flash(tools, `Not enough coins for the ${tool.name} (${tool.cost}).`);
    audio.deny();
    return false;
  }
  if (tool.id === 'lockpick' && !(level.vaultDoor && level.vaultDoor.locked)) {
    flash(tools, 'No locked door here to pick.');
    audio.deny();
    return false;
  }
  thief.coins -= tool.cost;
  if (tool.id === 'smoke') {
    tools.smokeClouds.push({ x: thief.x, y: thief.y, radius: 115, timer: 4.5 });
    for (const g of level.guards) {
      if (Math.hypot(g.x - thief.x, g.y - thief.y) < 150) g.blindTimer = 4.5;
    }
    flash(tools, 'Smoke out — move while they blink.');
    audio.puff();
  } else if (tool.id === 'emp') {
    for (const c of level.cameras) c.offTimer = 6;
    flash(tools, 'Cameras down for six seconds.');
    audio.zap();
  } else if (tool.id === 'lockpick') {
    level.vaultDoor.locked = false;
    flash(tools, 'The vault door clicks open.');
    audio.unlock();
  }
  return true;
}

export function updateTools(tools, dt) {
  for (const cloud of tools.smokeClouds) cloud.timer -= dt;
  tools.smokeClouds = tools.smokeClouds.filter((c) => c.timer > 0);
  for (const f of tools.flashes) f.timer -= dt;
  tools.flashes = tools.flashes.filter((f) => f.timer > 0);
}

export function flash(tools, text) {
  tools.flashes.push({ text, timer: 3 });
  if (tools.flashes.length > 2) tools.flashes.shift();
}
