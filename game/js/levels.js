// levels.js — the three rooms of the Velvet Vault job.
// Each level is plain data: walls the thief cannot cross, the loot worth
// stealing, the guards who walk it, the cameras that watch it, and the way out.
// Room bounds: x 16..1264, y 88..704. The HUD lives above y = 88.

export const ROOM = { x: 16, y: 88, w: 1248, h: 616 };

function borderWalls() {
  return [
    { x: 16, y: 88, w: 1248, h: 12 },   // north wall
    { x: 16, y: 692, w: 1248, h: 12 },  // south wall
    { x: 16, y: 88, w: 12, h: 616 },    // west wall
    { x: 1252, y: 88, w: 12, h: 616 },  // east wall
  ];
}

// A display case: solid, blocks sight and movement, worth hiding behind.
function displayCase(x, y, w, h) {
  return { x, y, w, h, kind: 'case' };
}

// A planter: solid and low, blocks movement but not sight.
function planter(x, y) {
  return { x, y, w: 46, h: 46, kind: 'planter' };
}

export function buildLevels() {
  return [
    {
      name: 'Room 1 — The Marble Gallery',
      intro: 'The gallery sleeps. Lift three pieces, then slip out the green door.',
      requiredLoot: 3,
      start: { x: 70, y: 640 },
      exit: { x: 1206, y: 132, w: 46, h: 60, label: 'GREEN DOOR' },
      walls: [
        ...borderWalls(),
        displayCase(300, 210, 130, 74),
        displayCase(700, 190, 130, 74),
        displayCase(300, 470, 130, 74),
        displayCase(700, 480, 130, 74),
        planter(560, 330),
        planter(1020, 540),
      ],
      loot: [
        { x: 640, y: 118, kind: 'painting', name: 'The Velvet Lady', coins: 40, taken: false },
        { x: 52, y: 330, kind: 'painting', name: 'Duchess in Blue', coins: 40, taken: false },
        { x: 765, y: 227, kind: 'gem', name: 'Star of Satsuki', coins: 60, taken: false },
        { x: 420, y: 640, kind: 'gold', name: 'Mint bars', coins: 30, taken: false },
      ],
      guards: [
        {
          name: 'Marlow', x: 250, y: 150, speed: 62, pause: 1.4,
          waypoints: [[250, 150], [1010, 150], [1010, 560], [250, 560]],
        },
        {
          name: 'Petra', x: 620, y: 620, speed: 58, pause: 1.1,
          waypoints: [[620, 620], [620, 150]],
        },
      ],
      cameras: [
        { x: 60, y: 112, base: 0.5, sweep: 0.85, speed: 0.45, phase: 0 },
        { x: 1220, y: 112, base: Math.PI - 0.5, sweep: 0.85, speed: 0.4, phase: 1.7 },
      ],
    },
    {
      name: 'Room 2 — The Gold Vault',
      intro: 'The vault door is shut. Channel it open, or spend a lockpick. Take four pieces.',
      requiredLoot: 4,
      start: { x: 70, y: 640 },
      exit: { x: 1206, y: 132, w: 46, h: 60, label: 'GREEN DOOR' },
      vaultDoor: { x: 600, y: 256, w: 80, h: 14, locked: true, channel: 0 },
      walls: [
        ...borderWalls(),
        // The vault: a walled strong room across the top middle.
        // Its only way in is the locked door in its south wall.
        { x: 520, y: 100, w: 14, h: 170, kind: 'vault' },
        { x: 726, y: 100, w: 14, h: 170, kind: 'vault' },
        { x: 520, y: 256, w: 80, h: 14, kind: 'vault' },
        { x: 680, y: 256, w: 60, h: 14, kind: 'vault' },
        displayCase(220, 330, 130, 74),
        displayCase(900, 330, 130, 74),
        displayCase(560, 470, 130, 74),
        planter(180, 540),
        planter(1080, 540),
      ],
      loot: [
        { x: 630, y: 150, kind: 'gold', name: 'Vault ingots', coins: 50, taken: false },
        { x: 580, y: 210, kind: 'gem', name: 'The Regent Ruby', coins: 70, taken: false },
        { x: 690, y: 210, kind: 'gem', name: 'The Pale Sapphire', coins: 70, taken: false },
        { x: 285, y: 367, kind: 'painting', name: 'Harbour at Dusk', coins: 40, taken: false },
        { x: 965, y: 367, kind: 'painting', name: 'The Fox Countess', coins: 40, taken: false },
      ],
      guards: [
        {
          name: 'Marlow', x: 200, y: 150, speed: 66, pause: 1.2,
          waypoints: [[200, 150], [1080, 150], [1080, 600], [200, 600]],
        },
        {
          name: 'Petra', x: 420, y: 600, speed: 62, pause: 1.0,
          waypoints: [[420, 600], [420, 330], [860, 330], [860, 600]],
        },
        {
          name: 'Otto', x: 1120, y: 420, speed: 58, pause: 1.5,
          waypoints: [[1120, 420], [1120, 180], [900, 180]],
        },
      ],
      cameras: [
        { x: 60, y: 112, base: 0.4, sweep: 0.8, speed: 0.5, phase: 0 },
        { x: 1220, y: 112, base: Math.PI - 0.4, sweep: 0.8, speed: 0.45, phase: 2.1 },
        { x: 640, y: 690, base: -Math.PI / 2, sweep: 0.9, speed: 0.5, phase: 0.9 },
      ],
    },
    {
      name: 'Room 3 — The Rooftop Escape',
      intro: 'Last room. Two pieces, then the skylight. The night air is already yours.',
      requiredLoot: 2,
      start: { x: 70, y: 640 },
      exit: { x: 617, y: 100, w: 46, h: 56, label: 'SKYLIGHT' },
      walls: [
        ...borderWalls(),
        displayCase(260, 220, 130, 74),
        displayCase(890, 220, 130, 74),
        displayCase(260, 480, 130, 74),
        displayCase(890, 480, 130, 74),
        planter(620, 330),
        planter(180, 330),
        planter(1080, 330),
      ],
      loot: [
        { x: 325, y: 257, kind: 'gem', name: 'The Moonstone', coins: 80, taken: false },
        { x: 955, y: 257, kind: 'painting', name: 'The Night Gardener', coins: 50, taken: false },
        { x: 640, y: 620, kind: 'gold', name: 'Roof stash', coins: 40, taken: false },
      ],
      guards: [
        {
          name: 'Marlow', x: 180, y: 140, speed: 78, pause: 0.8,
          waypoints: [[180, 140], [1100, 140], [1100, 620], [180, 620]],
        },
        {
          name: 'Otto', x: 640, y: 620, speed: 74, pause: 0.9,
          waypoints: [[640, 620], [640, 180]],
        },
      ],
      cameras: [
        { x: 60, y: 112, base: 0.6, sweep: 0.9, speed: 0.6, phase: 0 },
        { x: 1220, y: 112, base: Math.PI - 0.6, sweep: 0.9, speed: 0.55, phase: 1.2 },
      ],
    },
  ];
}
