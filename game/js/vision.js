// vision.js — the geometry of seeing: cones, sight lines and wall blocking.
// Nothing here knows about the game; it only answers questions about points,
// angles and rectangles.

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Is the point (px, py) inside the watcher's cone?
export function insideCone(wx, wy, facing, range, halfAngle, px, py) {
  const d = distance(wx, wy, px, py);
  if (d > range) return false;
  if (d < 14) return true;
  const a = angleTo(wx, wy, px, py);
  return Math.abs(angleDiff(a, facing)) <= halfAngle;
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle r?
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return dx === 0 && dy === 0;
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True when no wall stands between watcher and target.
export function lineOfSight(wx, wy, tx, ty, walls) {
  for (const w of walls) {
    if (segmentHitsRect(wx, wy, tx, ty, w)) return false;
  }
  return true;
}

// Move a circle (x, y, radius) by (dx, dy), sliding along solid rectangles.
// Returns the new position; the circle never ends up inside a wall.
export function slideMove(x, y, radius, dx, dy, solids) {
  let nx = x + dx;
  let ny = y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, y, radius, s)) nx = x;
    if (circleHitsRect(nx, ny, radius, s)) ny = y;
    if (circleHitsRect(nx, ny, radius, s)) { nx = x; ny = y; }
  }
  return { x: nx, y: ny };
}

export function circleHitsRect(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}
