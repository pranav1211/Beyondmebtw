/* ========================================
   BBAS - Geometry Utilities
   Point-in-polygon detection and geometric calculations
   ======================================== */

/**
 * Calculate Euclidean distance between two points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {number} Distance between points
 */
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {Object} point - Point to test {x, y}
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @returns {boolean} True if point is inside polygon
 */
export function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  let inside = false;
  const x = point.x;
  const y = point.y;

  // Ray casting algorithm
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Check if ray from point crosses edge
    const intersect = ((yi > y) !== (yj > y)) &&
                     (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate the center point (centroid) of a polygon
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @returns {Object} Center point {x, y}
 */
export function getPolygonCenter(polygon) {
  if (!polygon || polygon.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const point of polygon) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length
  };
}

/**
 * Calculate the area of a polygon using the shoelace formula
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @returns {number} Area of polygon
 */
export function getPolygonArea(polygon) {
  if (!polygon || polygon.length < 3) {
    return 0;
  }

  let area = 0;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
  }

  return Math.abs(area / 2);
}

/**
 * Check if a point is near another point (within threshold distance)
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @param {number} threshold - Maximum distance to be considered "near"
 * @returns {boolean} True if points are within threshold distance
 */
export function isNearPoint(p1, p2, threshold = 10) {
  return distance(p1, p2) <= threshold;
}

/**
 * Get the bounding box of a polygon
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @returns {Object} Bounding box {minX, minY, maxX, maxY, width, height}
 */
export function getPolygonBounds(polygon) {
  if (!polygon || polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Scale a polygon by a factor
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @param {number} scaleX - Scale factor for x-axis
 * @param {number} scaleY - Scale factor for y-axis
 * @returns {Array} Scaled polygon
 */
export function scalePolygon(polygon, scaleX, scaleY = scaleX) {
  if (!polygon || polygon.length === 0) {
    return [];
  }

  return polygon.map(point => ({
    x: point.x * scaleX,
    y: point.y * scaleY
  }));
}

/**
 * Translate a polygon by offset
 * @param {Array} polygon - Array of polygon vertices [{x, y}, ...]
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @returns {Array} Translated polygon
 */
export function translatePolygon(polygon, offsetX, offsetY) {
  if (!polygon || polygon.length === 0) {
    return [];
  }

  return polygon.map(point => ({
    x: point.x + offsetX,
    y: point.y + offsetY
  }));
}
