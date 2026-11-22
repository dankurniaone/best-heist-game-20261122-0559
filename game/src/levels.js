// The three rooms of The Marlowe Job. Each level is a hand-drawn floor plan:
// walls are rectangles, guards walk waypoint loops, cameras sweep from the
// walls, loot sits in the open or behind a route choice. Coordinates are canvas
// pixels inside the room (x 24..1256, y 76..700); the room is one fixed view,
// so every level reads at a glance in a screenshot.

export const LEVELS = [
  {
    id: 'gallery',
    name: 'I — THE MARLOWE GALLERY',
    subtitle: 'Steal the Star of Marlowe, then slip out the service door.',
    parSeconds: 150,
    alarmStart: 0,
    start: { x: 100, y: 640 },
    exit: { x: 1150, y: 96, w: 84, h: 30, label: 'SERVICE DOOR', lockedUntil: 'diamond' },
    walls: [
      // Top corridor: a quiet route along the north wall, reached by the vent
      // or the east doorway. The wall stops short on the right.
      { x: 24, y: 218, w: 676, h: 14 },
      // Side room in the south-west: a gold bar behind a doorway.
      { x: 420, y: 480, w: 14, h: 220 },
      { x: 420, y: 480, w: 260, h: 14 },
      // Two display plinths the thief must walk around in the main hall.
      { x: 300, y: 330, w: 90, h: 60 },
      { x: 890, y: 330, w: 90, h: 60 },
      { x: 300, y: 520, w: 90, h: 60 },
      { x: 890, y: 520, w: 90, h: 60 },
    ],
    vents: [
      // The old air duct: hold E at either grate to crawl to the other end,
      // past the main hall and its patrols.
      { x: 30, y: 300, w: 34, h: 90, to: { x: 1060, y: 150 }, seconds: 1.5 },
      { x: 1042, y: 108, w: 34, h: 90, to: { x: 48, y: 345 }, seconds: 1.5 },
    ],
    loot: [
      { id: 'diamond', kind: 'diamond', x: 640, y: 388, value: 50000, name: 'THE STAR OF MARLOWE' },
      { id: 'paint-a', kind: 'painting', x: 60, y: 150, value: 8000, name: '“Harbour at Dusk”' },
      { id: 'paint-b', kind: 'painting', x: 1180, y: 560, value: 8000, name: '“The Blue Room”' },
      { id: 'gold-a', kind: 'gold', x: 300, y: 640, value: 12000, name: 'Gold bar' },
    ],
    guards: [
      { waypoints: [{ x: 400, y: 300 }, { x: 880, y: 300 }, { x: 880, y: 540 }, { x: 400, y: 540 }], pause: 1.2 },
      { waypoints: [{ x: 220, y: 150 }, { x: 1080, y: 150 }], pause: 1.6 },
    ],
    cameras: [
      { x: 640, y: 88, baseAngle: Math.PI / 2, sweep: 0.9, range: 270 },
      { x: 1244, y: 400, baseAngle: Math.PI, sweep: 0.7, range: 260 },
    ],
    lasers: [],
    vault: null,
  },
  {
    id: 'vault',
    name: 'II — THE VAULT HALL',
    subtitle: 'Crack the vault (hold E, 3 seconds), take the gold, get out.',
    parSeconds: 180,
    alarmStart: 0,
    start: { x: 100, y: 640 },
    exit: { x: 1150, y: 640, w: 84, h: 30, label: 'SERVICE DOOR', lockedUntil: 'vault' },
    walls: [
      // The vault approach: a long corridor with a laser grid across it.
      { x: 24, y: 218, w: 560, h: 14 },
      { x: 700, y: 218, w: 556, h: 14 },
      // Vault antechamber walls.
      { x: 820, y: 300, w: 14, h: 220 },
      { x: 820, y: 300, w: 200, h: 14 },
      { x: 820, y: 506, w: 200, h: 14 },
      // Cover blocks in the hall.
      { x: 300, y: 420, w: 110, h: 60 },
      { x: 560, y: 560, w: 110, h: 60 },
    ],
    vents: [
      { x: 30, y: 300, w: 34, h: 90, to: { x: 760, y: 640 }, seconds: 1.5 },
      { x: 742, y: 598, w: 34, h: 90, to: { x: 48, y: 345 }, seconds: 1.5 },
    ],
    loot: [
      { id: 'paint-c', kind: 'painting', x: 60, y: 150, value: 8000, name: '“Winter Garden”' },
      { id: 'paint-d', kind: 'painting', x: 1180, y: 150, value: 8000, name: '“Red Study”' },
      { id: 'gold-b', kind: 'gold', x: 360, y: 560, value: 12000, name: 'Gold bar' },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 300 }, { x: 760, y: 300 }, { x: 760, y: 620 }, { x: 300, y: 620 }], pause: 1.0 },
      { waypoints: [{ x: 150, y: 150 }, { x: 560, y: 150 }], pause: 1.4 },
      { waypoints: [{ x: 1060, y: 300 }, { x: 1060, y: 620 }], pause: 1.2 },
    ],
    cameras: [
      { x: 900, y: 88, baseAngle: Math.PI / 2, sweep: 0.8, range: 270 },
      { x: 1244, y: 300, baseAngle: Math.PI, sweep: 0.6, range: 250 },
    ],
    // Three laser bars across the vault approach (y 280, 380, 480): each has a
    // gap that slides along the bar. Touching a beam spikes the alarm.
    lasers: [
      { y: 280, x1: 600, x2: 820, gap: 90, speed: 60, phase: 0 },
      { y: 380, x1: 600, x2: 820, gap: 90, speed: 80, phase: 0.5 },
      { y: 480, x1: 600, x2: 820, gap: 90, speed: 60, phase: 1.0 },
    ],
    vault: { x: 900, y: 340, w: 150, h: 140, crackSeconds: 3, gold: 30000 },
  },
  {
    id: 'rooftop',
    name: 'III — ROOFTOP GETAWAY',
    subtitle: 'The alarm is already hot. Reach the skylight with the loot.',
    parSeconds: 120,
    alarmStart: 40,
    start: { x: 100, y: 640 },
    exit: { x: 1150, y: 96, w: 84, h: 30, label: 'SKYLIGHT', lockedUntil: null },
    walls: [
      // Air-conditioning units and vents: cover, not corridors.
      { x: 300, y: 200, w: 130, h: 90 },
      { x: 700, y: 200, w: 130, h: 90 },
      { x: 480, y: 440, w: 130, h: 90 },
      { x: 900, y: 440, w: 130, h: 90 },
    ],
    vents: [],
    loot: [
      { id: 'gold-c', kind: 'gold', x: 360, y: 540, value: 12000, name: 'Gold bar' },
      { id: 'gold-d', kind: 'gold', x: 760, y: 300, value: 12000, name: 'Gold bar' },
    ],
    guards: [
      { waypoints: [{ x: 220, y: 340 }, { x: 1060, y: 340 }], pause: 1.0 },
      { waypoints: [{ x: 640, y: 150 }, { x: 640, y: 620 }], pause: 1.2 },
    ],
    cameras: [
      { x: 640, y: 88, baseAngle: Math.PI / 2, sweep: 1.0, range: 280 },
      { x: 1244, y: 560, baseAngle: Math.PI, sweep: 0.8, range: 260 },
    ],
    lasers: [],
    vault: null,
  },
];

export const TOTAL_LOOT = LEVELS.reduce(
  (sum, level) =>
    sum + level.loot.reduce((s, l) => s + l.value, 0) + (level.vault ? level.vault.gold : 0),
  0,
);
