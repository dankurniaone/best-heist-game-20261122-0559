// Small geometry helpers shared by movement, vision and lasers.
// Walls are axis-aligned rectangles; everything else is a point or a circle.

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

/** Push a circle out of a rectangle it overlaps; returns the corrected position. */
export function resolveCircleRect(x, y, r, rect) {
  const nx = clamp(x, rect.x, rect.x + rect.w);
  const ny = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nx;
  const dy = y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x, y, hit: false };
  if (d2 === 0) {
    // Centre inside the rectangle: push out along the smallest penetration.
    const left = x - rect.x; const right = rect.x + rect.w - x;
    const top = y - rect.y; const bottom = rect.y + rect.h - y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rect.x - r, y, hit: true };
    if (m === right) return { x: rect.x + rect.w + r, y, hit: true };
    if (m === top) return { x, y: rect.y - r, hit: true };
    return { x, y: rect.y + rect.h + r, hit: true };
  }
  const d = Math.sqrt(d2);
  return { x: nx + (dx / d) * r, y: ny + (dy / d) * r, hit: true };
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment enter the rectangle's box?
  const dx = x2 - x1; const dy = y2 - y1;
  let tmin = 0; let tmax = 1;
  const axes = [
    [dx, x1, rect.x, rect.x + rect.w],
    [dy, y1, rect.y, rect.y + rect.h],
  ];
  for (const [d, o, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return false;
    } else {
      let t1 = (lo - o) / d; let t2 = (hi - o) / d;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

/** True when no wall blocks the line of sight between two points. */
export function hasLineOfSight(ax, ay, bx, by, walls) {
  for (const w of walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return false;
  }
  return true;
}

/** True when the point sits inside any smoke cloud. */
export function inSmoke(x, y, clouds) {
  for (const c of clouds) {
    if (dist(x, y, c.x, c.y) < c.radius) return true;
  }
  return false;
}

/** Angle difference wrapped to [-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
