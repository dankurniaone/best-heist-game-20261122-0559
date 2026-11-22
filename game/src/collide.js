// Collision and line of sight: the only geometry the game needs.
// Everything is axis-aligned rectangles and circles; sight is a segment
// tested against rectangles.

/** Push a circle out of a rectangle. Returns true when they overlapped. */
export function pushOutOfRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x: px, y: py, hit: false };
  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    const push = (r - d) / d;
    return { x: px + dx * push, y: py + dy * push, hit: true };
  }
  // Centre inside the rectangle: push out along the shallowest side.
  const left = px - rect.x;
  const right = rect.x + rect.w - px;
  const top = py - rect.y;
  const bottom = rect.y + rect.h - py;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: rect.x - r, y: py, hit: true };
  if (m === right) return { x: rect.x + rect.w + r, y: py, hit: true };
  if (m === top) return { x: px, y: rect.y - r, hit: true };
  return { x: px, y: rect.y + rect.h + r, hit: true };
}

/** Move a circle by (dx, dy), sliding along every rectangle it meets. */
export function moveCircle(px, py, r, dx, dy, solids) {
  let x = px + dx;
  let y = py + dy;
  for (const rect of solids) {
    const out = pushOutOfRect(x, y, r, rect);
    x = out.x;
    y = out.y;
  }
  return { x, y };
}

/** Whether a point sits inside a rectangle (edges count). */
export function insideRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

/** Whether two segments (a-b and c-d) cross. */
function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Whether the segment a-b is cut by a rectangle. */
export function segmentHitsRect(ax, ay, bx, by, rect) {
  if (insideRect(ax, ay, rect) || insideRect(bx, by, rect)) return true;
  const x0 = rect.x;
  const y0 = rect.y;
  const x1 = rect.x + rect.w;
  const y1 = rect.y + rect.h;
  return (
    segmentsCross(ax, ay, bx, by, x0, y0, x1, y0) ||
    segmentsCross(ax, ay, bx, by, x1, y0, x1, y1) ||
    segmentsCross(ax, ay, bx, by, x1, y1, x0, y1) ||
    segmentsCross(ax, ay, bx, by, x0, y1, x0, y0)
  );
}

/** Whether anything solid stands between (ax, ay) and (bx, by). */
export function blocked(ax, ay, bx, by, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return true;
  }
  return false;
}

/** Whether a point lies inside a circle. */
export function insideCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Angle from (ax, ay) to (bx, by), in radians. */
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/** Smallest absolute difference between two angles, 0..PI. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** Distance between two points. */
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Clamp a number into [lo, hi]. */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
