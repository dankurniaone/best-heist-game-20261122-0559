// Shared constants for The Marlowe Job: canvas size, palette, tuning.
// One place holds every number the other modules read, so a balance change
// never means hunting through render code.

export const VIEW = { width: 1280, height: 720 };
export const HUD_HEIGHT = 56;
export const ROOM = { x: 24, y: 76, width: 1232, height: 624 };
export const WALL = 14;

export const PALETTE = {
  floorA: '#101826',
  floorB: '#131d2e',
  grid: '#1b2740',
  wall: '#39404d',
  wallTrim: '#c9a227',
  gold: '#c9a227',
  goldBright: '#f5d67a',
  loot: '#7fd4ff',
  diamond: '#bfe9ff',
  danger: '#e5484d',
  warn: '#e5a13d',
  ok: '#3fb96b',
  coneGuard: 'rgba(245, 214, 122, 0.20)',
  coneGuardEdge: 'rgba(245, 214, 122, 0.55)',
  coneCamera: 'rgba(229, 72, 77, 0.16)',
  coneCameraEdge: 'rgba(229, 72, 77, 0.5)',
  smoke: 'rgba(180, 190, 205, 0.55)',
  text: '#e8ece9',
  muted: '#9aa39d',
  hud: '#0b0e13',
  hudLine: '#262b28',
};

// Movement and stealth tuning.
export const PLAYER = {
  radius: 13,
  walkSpeed: 205, // px per second
  sneakSpeed: 118,
  runSpeed: 265,
  // Detection range multipliers: sneaking shrinks how far guards spot you,
  // running grows it. Standing still in the open is the middle case.
  sneakSpot: 0.62,
  walkSpot: 1.0,
  runSpot: 1.35,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 168,
  viewRange: 235,
  viewAngle: (68 * Math.PI) / 180, // half-angle of the vision cone
  suspicionRate: 1.6, // suspicion per second while the thief is in the cone
  suspicionDecay: 0.45,
  graceSeconds: 1.2, // "!" warning before a fully suspicious guard gives chase
  loseSeconds: 4, // seconds out of sight before a chasing guard gives up
};

export const CAMERA = {
  range: 270,
  angle: (52 * Math.PI) / 180,
  sweepSpeed: 0.55, // radians per second
  alarmRate: 26, // alarm points per second while the thief is in the cone
};

export const ALARM = {
  guardRate: 34, // alarm points per second while any guard fully sees the thief
  decay: 5, // points per second while nobody sees the thief
  max: 100,
};

export const TOOLS = {
  smokeCount: 3,
  smokeRadius: 95,
  smokeSeconds: 6,
  empCount: 2,
  empSeconds: 8,
};

export const LIVES = 3;
export const GHOST_BONUS = 5000; // dollars, when the alarm never passed 25
export const GHOST_THRESHOLD = 25;

export const STEP = 1 / 60;
