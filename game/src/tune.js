// The Marlowe Job — tuning, palette and shared constants.
// One place holds every number a designer would argue about, so the rest of
// the game reads as rules, not magic numbers.

export const WORLD = { w: 1200, h: 600 };

// The whole run's loot, room by room. It sums to $124,000.
export const TOTAL_LOOT = 124000;

// A thief walks at 170 units a second, sneaks at 85.
export const THIEF = {
  radius: 13,
  walk: 170,
  sneak: 85,
  grabReach: 48,
  grabTime: 0.35,
  diamondTime: 1.0,
  vaultTime: 3.0,
  ventTime: 1.2,
};

// A guard patrols at 70, chases at 132. Its cone reaches 230 units wide open,
// 128 when the thief sneaks. Suspicion fills while it sees the thief and
// drains when it does not; at full it gives a 1.2 s grace before the chase.
export const GUARD = {
  radius: 14,
  patrolSpeed: 70,
  chaseSpeed: 132,
  returnSpeed: 95,
  sight: 230,
  sightSneak: 128,
  halfAngle: 0.56,
  fillWalk: 1.35,
  fillSneak: 0.7,
  fillClose: 1.6,
  drain: 0.45,
  grace: 1.2,
  catchDist: 27,
  searchTime: 4,
  loseTime: 3,
};

// A camera sweeps a red cone across the room. EMP blinds every camera.
export const CAMERA = {
  range: 265,
  halfAngle: 0.49,
  alarmPerSecond: 6,
  empBlind: 8,
};

// Lasers slide a gap along each beam. Crossing a live beam costs alarm.
export const LASER = { tripAlarm: 12, width: 5 };

// The alarm rises while anyone sees the thief, bleeds off in the dark.
export const ALARM = {
  guardPerSecond: 8,
  decayPerSecond: 2.5,
  caughtReset: 40,
  ghostCeiling: 25,
  proCeiling: 60,
};

// Tools: three smoke bombs a room, two EMP bursts a whole run.
export const TOOLS = { smokePerRoom: 3, empPerRun: 2, smokeRadius: 92, smokeLife: 6 };

export const LIVES = 3;
export const GHOST_BONUS = 5000;
export const ROOM_PARS = [150, 180, 120];

// The palette: a museum at night. Navy floor, brass gold, danger red.
export const PALETTE = {
  page: '#0b0e13',
  floorA: '#171d2b',
  floorB: '#131824',
  floorLine: '#232c40',
  wall: '#2b3550',
  wallEdge: '#c9a227',
  gold: '#c9a227',
  goldBright: '#e8c95a',
  goldDim: '#8a7320',
  ink: '#e8ece9',
  inkDim: '#9aa39d',
  inkFaint: '#6b726c',
  danger: '#e5484d',
  dangerSoft: 'rgba(229,72,77,0.20)',
  coneGuard: 'rgba(232,201,90,0.20)',
  coneGuardHot: 'rgba(232,201,90,0.34)',
  coneCamera: 'rgba(229,72,77,0.18)',
  coneCameraHot: 'rgba(229,72,77,0.32)',
  safe: '#3fb96b',
  thief: '#1a2233',
  thiefRing: '#3fb96b',
  lootGold: '#e8c95a',
  diamond: '#dfe9ff',
  smoke: 'rgba(180,190,200,0.55)',
  scrim: 'rgba(5,7,10,0.78)',
};

// Seconds of play the staged screenshots pretend have passed.
export const STAGE = {
  play: { loot: 8000, time: 41, alarm: 32 },
  vault: { loot: 92000, time: 246, alarm: 58 },
};
