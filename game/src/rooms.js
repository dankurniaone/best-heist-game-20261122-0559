// The three rooms of the Marlowe Museum, as data. Each room is a floor
// plan: walls and cases to hide behind, loot to choose between, guards on
// patrol loops, cameras sweeping, vents joining two grates, and one exit
// that only opens once the room's job is done. Every room has three ways
// through: the open floor, a side corridor, and the vents.

export const ROOMS = [
  {
    id: 0,
    name: 'I — THE MARLOWE GALLERY',
    par: 150,
    alarmStart: 0,
    entry: { x: 70, y: 540 },
    exit: { x: 1100, y: 30, w: 70, h: 60, label: 'SERVICE DOOR' },
    exitNeeds: 'diamond',
    objective: 'STEAL THE STAR',
    hint: 'The Star of Marlowe sits in the middle case. The east guard is turning — go now, quiet and low.',
    walls: [
      { x: 300, y: 150, w: 420, h: 18 },
      { x: 480, y: 430, w: 300, h: 18 },
      { x: 880, y: 180, w: 18, h: 200 },
      { x: 220, y: 300, w: 18, h: 180 },
    ],
    cases: [
      { x: 250, y: 250, w: 90, h: 60, kind: 'case' },
      { x: 850, y: 380, w: 90, h: 60, kind: 'case' },
      { x: 420, y: 90, w: 70, h: 46, kind: 'case' },
      { x: 980, y: 480, w: 80, h: 54, kind: 'case' },
    ],
    loot: [
      { id: 'star', kind: 'diamond', x: 600, y: 280, value: 50000, label: 'THE STAR OF MARLOWE' },
      { id: 'paint-a', kind: 'painting', x: 350, y: 42, value: 8000, label: '$8,000' },
      { id: 'paint-b', kind: 'painting', x: 950, y: 556, value: 8000, label: '$8,000' },
    ],
    vault: null,
    lasers: [],
    guards: [
      { waypoints: [[300, 300], [700, 300], [700, 480], [300, 480]] },
      { waypoints: [[1000, 120], [1000, 480]] },
    ],
    cameras: [{ x: 600, y: 14, base: Math.PI / 2, sweep: 0.7, period: 5 }],
    vents: [
      { x: 34, y: 300, pair: 1 },
      { x: 900, y: 566, pair: 0 },
    ],
  },
  {
    id: 1,
    name: 'II — THE VAULT HALL',
    par: 180,
    alarmStart: 0,
    entry: { x: 70, y: 60 },
    exit: { x: 1100, y: 510, w: 70, h: 60, label: 'SERVICE DOOR' },
    exitNeeds: 'vault',
    objective: 'CRACK THE VAULT',
    hint: 'Hold E at the vault dial. The laser grid slides — cross through the gap, never through the beam.',
    walls: [
      { x: 180, y: 140, w: 18, h: 220 },
      { x: 700, y: 120, w: 18, h: 160 },
      { x: 700, y: 360, w: 18, h: 140 },
      { x: 420, y: 470, w: 260, h: 18 },
    ],
    cases: [
      { x: 300, y: 90, w: 90, h: 54, kind: 'case' },
      { x: 980, y: 90, w: 90, h: 54, kind: 'case' },
      { x: 300, y: 500, w: 90, h: 54, kind: 'case' },
    ],
    loot: [
      { id: 'gold-a', kind: 'gold', x: 150, y: 520, value: 12000, label: '$12,000' },
      { id: 'paint-c', kind: 'painting', x: 600, y: 42, value: 8000, label: '$8,000' },
    ],
    vault: { x: 900, y: 220, w: 180, h: 160, gold: 26000 },
    lasers: [
      { y: 200, x0: 300, x1: 880, gap: 420, gapW: 130, speed: 55 },
      { y: 300, x0: 300, x1: 880, gap: 640, gapW: 130, speed: -70 },
      { y: 400, x0: 300, x1: 880, gap: 500, gapW: 130, speed: 60 },
    ],
    guards: [
      { waypoints: [[250, 150], [650, 150], [650, 500], [250, 500]] },
      { waypoints: [[950, 100], [950, 500]] },
    ],
    cameras: [
      { x: 150, y: 14, base: Math.PI / 2, sweep: 0.6, period: 4 },
      { x: 1050, y: 14, base: Math.PI / 2, sweep: 0.6, period: 6 },
    ],
    vents: [
      { x: 34, y: 450, pair: 1 },
      { x: 1166, y: 300, pair: 0 },
    ],
  },
  {
    id: 2,
    name: 'III — ROOFTOP GETAWAY',
    par: 120,
    alarmStart: 30,
    entry: { x: 70, y: 540 },
    exit: { x: 565, y: 20, w: 70, h: 50, label: 'SKYLIGHT' },
    exitNeeds: null,
    objective: 'REACH THE SKYLIGHT',
    hint: 'The alarm is already hot. The skylight is straight ahead — crates and the vent are your only cover.',
    walls: [
      { x: 380, y: 180, w: 18, h: 220 },
      { x: 760, y: 200, w: 18, h: 220 },
    ],
    cases: [
      { x: 300, y: 420, w: 110, h: 70, kind: 'crate' },
      { x: 780, y: 420, w: 110, h: 70, kind: 'crate' },
      { x: 520, y: 300, w: 160, h: 60, kind: 'crate' },
      { x: 150, y: 180, w: 90, h: 60, kind: 'crate' },
      { x: 960, y: 180, w: 90, h: 60, kind: 'crate' },
    ],
    loot: [{ id: 'gold-b', kind: 'gold', x: 1050, y: 500, value: 12000, label: '$12,000' }],
    vault: null,
    lasers: [],
    guards: [
      { waypoints: [[250, 120], [950, 120], [950, 300], [250, 300]] },
      { waypoints: [[600, 480], [1050, 480], [1050, 200], [600, 200]] },
    ],
    cameras: [{ x: 600, y: 14, base: Math.PI / 2, sweep: 0.8, period: 4.5 }],
    vents: [
      { x: 34, y: 300, pair: 1 },
      { x: 1166, y: 420, pair: 0 },
    ],
  },
];

/** The room's solid rectangles: walls plus cases plus the vault. */
export function roomSolids(room) {
  const solids = [...room.walls, ...room.cases];
  if (room.vault) solids.push({ x: room.vault.x, y: room.vault.y, w: room.vault.w, h: room.vault.h });
  return solids;
}

/** The room's loot value, for the HUD's "of $124,000". */
export function roomLootValue(room) {
  let n = room.loot.reduce((s, l) => s + l.value, 0);
  if (room.vault) n += room.vault.gold;
  return n;
}
