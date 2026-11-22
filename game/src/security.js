// Security systems: wall cameras with sweeping cones, the vault's laser grid,
// and the alarm meter that ties them together. Cameras and lasers never kill
// outright — they raise the alarm, and a full alarm is what gets the thief caught.

import { ALARM, CAMERA } from './config.js';
import { angleDiff, dist, hasLineOfSight, inSmoke } from './geom.js';

export function createCamera(def) {
  return {
    x: def.x, y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    range: def.range,
    angle: def.baseAngle,
    disabledUntil: 0,
    seesPlayer: false,
  };
}

/** Sweep the camera and report whether it sees the thief this frame. */
export function updateCamera(camera, now, player, walls, clouds) {
  camera.angle = camera.baseAngle + Math.sin(now * CAMERA.sweepSpeed) * camera.sweep;
  if (now < camera.disabledUntil) {
    camera.seesPlayer = false;
    return false;
  }
  const d = dist(camera.x, camera.y, player.x, player.y);
  if (d > camera.range) { camera.seesPlayer = false; return false; }
  const toPlayer = Math.atan2(player.y - camera.y, player.x - camera.x);
  if (Math.abs(angleDiff(toPlayer, camera.angle)) > CAMERA.angle) {
    camera.seesPlayer = false;
    return false;
  }
  if (inSmoke(player.x, player.y, clouds)) { camera.seesPlayer = false; return false; }
  if (!hasLineOfSight(camera.x, camera.y, player.x, player.y, walls)) {
    camera.seesPlayer = false;
    return false;
  }
  camera.seesPlayer = true;
  return true;
}

export function createLaser(def) {
  return {
    y: def.y, x1: def.x1, x2: def.x2,
    gap: def.gap, speed: def.speed, phase: def.phase,
    gapCenter: def.x1 + def.gap,
    tripped: false,
  };
}

/** Slide the gap back and forth; report a trip when the thief crosses the beam. */
export function updateLaser(laser, now, player) {
  const span = laser.x2 - laser.x1 - laser.gap;
  const t = (Math.sin(now * laser.speed * 0.05 + laser.phase * Math.PI) + 1) / 2;
  laser.gapCenter = laser.x1 + laser.gap / 2 + t * span;
  const nearBeam = Math.abs(player.y - laser.y) < player.radius + 3;
  const inSpan = player.x > laser.x1 && player.x < laser.x2;
  const inGap = Math.abs(player.x - laser.gapCenter) < laser.gap / 2;
  const tripped = nearBeam && inSpan && !inGap;
  if (tripped && !laser.tripped) {
    laser.tripped = true;
    return true;
  }
  if (!tripped) laser.tripped = false;
  return false;
}

export function createAlarm(start) {
  return { value: start || 0, peak: start || 0 };
}

/** Raise the alarm while anyone sees the thief; let it bleed off in the dark. */
export function updateAlarm(alarm, dt, seenByGuard, seenByCamera) {
  if (seenByGuard) alarm.value += ALARM.guardRate * dt;
  if (seenByCamera) alarm.value += CAMERA.alarmRate * dt;
  if (!seenByGuard && !seenByCamera) alarm.value -= ALARM.decay * dt;
  alarm.value = Math.max(0, Math.min(ALARM.max, alarm.value));
  alarm.peak = Math.max(alarm.peak, alarm.value);
  return alarm.value >= ALARM.max;
}
