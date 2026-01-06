/* ========================================
   BBAS - Boundary Editor Component
   Interactive polygon drawing on canvas overlay
   ======================================== */

import { CONFIG } from '../config/constants.js';
import { isNearPoint, distance, isPointInPolygon } from '../utils/geometry.js';

class BoundaryEditor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Drawing state
    this.isDrawing = false;
    this.currentPoints = [];
    this.boundaries = [];
    this.hoveredPointIndex = -1;

    // Mouse tracking
    this.mousePos = { x: 0, y: 0 };

    // Event listeners
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);

    console.log('[BoundaryEditor] Boundary editor initialized');
  }

  /**
   * Start drawing mode
   */
  startDrawing() {
    if (this.isDrawing) {
      console.warn('[BoundaryEditor] Already in drawing mode');
      return;
    }

    this.isDrawing = true;
    this.currentPoints = [];
    this.hoveredPointIndex = -1;

    // Add event listeners
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);

    // Change cursor
    this.canvas.style.cursor = 'crosshair';

    console.log('[BoundaryEditor] Drawing mode started');
  }

  /**
   * Stop drawing mode
   */
  stopDrawing() {
    if (!this.isDrawing) {
      return;
    }

    this.isDrawing = false;
    this.hoveredPointIndex = -1;

    // Remove event listeners
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);

    // Reset cursor
    this.canvas.style.cursor = 'default';

    // Clear current points if not enough to form a polygon
    if (this.currentPoints.length < CONFIG.BOUNDARY.MIN_POINTS) {
      this.currentPoints = [];
    }

    console.log('[BoundaryEditor] Drawing mode stopped');
  }

  /**
   * Handle mouse move event
   */
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Check if hovering over first point
    if (this.currentPoints.length >= CONFIG.BOUNDARY.MIN_POINTS) {
      const firstPoint = this.currentPoints[0];
      if (isNearPoint(this.mousePos, firstPoint, CONFIG.BOUNDARY.POINT_RADIUS * 2)) {
        this.hoveredPointIndex = 0;
      } else {
        this.hoveredPointIndex = -1;
      }
    }

    // Redraw to show preview
    this.draw();
  }

  /**
   * Handle canvas click event
   */
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Check if clicking near first point to close polygon
    if (this.currentPoints.length >= CONFIG.BOUNDARY.MIN_POINTS) {
      const firstPoint = this.currentPoints[0];

      if (isNearPoint(point, firstPoint, CONFIG.BOUNDARY.POINT_RADIUS * 2)) {
        // Close the polygon
        this.closePolygon();
        return;
      }
    }

    // Add new point
    this.currentPoints.push(point);
    console.log(`[BoundaryEditor] Point added: (${Math.round(point.x)}, ${Math.round(point.y)})`);

    this.draw();
  }

  /**
   * Close the current polygon and add to boundaries
   */
  closePolygon() {
    if (this.currentPoints.length < CONFIG.BOUNDARY.MIN_POINTS) {
      console.warn('[BoundaryEditor] Need at least 3 points to close polygon');
      return;
    }

    // Add to boundaries
    this.boundaries.push([...this.currentPoints]);

    console.log(`[BoundaryEditor] Polygon closed with ${this.currentPoints.length} points`);

    // Stop drawing and clear current points
    this.stopDrawing();
    this.currentPoints = [];

    // Redraw to show completed boundary
    this.draw();
  }

  /**
   * Clear all boundaries and current drawing
   */
  clear() {
    this.boundaries = [];
    this.currentPoints = [];
    this.hoveredPointIndex = -1;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    console.log('[BoundaryEditor] All boundaries cleared');
  }

  /**
   * Get all boundaries
   */
  getBoundaries() {
    return this.boundaries;
  }

  /**
   * Set boundaries (for loading saved boundaries)
   */
  setBoundaries(boundaries) {
    this.boundaries = boundaries || [];
    this.draw();
    console.log(`[BoundaryEditor] Loaded ${this.boundaries.length} boundaries`);
  }

  /**
   * Draw all boundaries and current drawing on canvas
   */
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw completed boundaries
    for (const boundary of this.boundaries) {
      this.drawPolygon(boundary, CONFIG.BOUNDARY.COLORS.RESTRICTED, true);
    }

    // Draw current drawing in progress
    if (this.isDrawing && this.currentPoints.length > 0) {
      this.drawPolygon(this.currentPoints, CONFIG.BOUNDARY.COLORS.DRAWING, false);

      // Draw line from last point to mouse cursor
      if (this.currentPoints.length > 0) {
        const lastPoint = this.currentPoints[this.currentPoints.length - 1];

        this.ctx.beginPath();
        this.ctx.strokeStyle = CONFIG.BOUNDARY.COLORS.DRAWING;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Highlight first point if hovering near it
      if (this.hoveredPointIndex === 0 && this.currentPoints.length >= CONFIG.BOUNDARY.MIN_POINTS) {
        const firstPoint = this.currentPoints[0];
        this.ctx.beginPath();
        this.ctx.arc(firstPoint.x, firstPoint.y, CONFIG.BOUNDARY.POINT_RADIUS * 1.5, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
  }

  /**
   * Draw a polygon on canvas
   */
  drawPolygon(points, color, filled = true) {
    if (points.length === 0) return;

    const ctx = this.ctx;

    // Draw filled polygon
    if (filled && points.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw lines
    ctx.beginPath();
    ctx.strokeStyle = CONFIG.BOUNDARY.COLORS.LINE;
    ctx.lineWidth = CONFIG.BOUNDARY.LINE_WIDTH;
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (filled && points.length >= 3) {
      ctx.closePath();
    }

    ctx.stroke();

    // Draw points
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      ctx.beginPath();
      ctx.arc(point.x, point.y, CONFIG.BOUNDARY.POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = CONFIG.BOUNDARY.COLORS.POINT;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Get boundary count
   */
  getBoundaryCount() {
    return this.boundaries.length;
  }

  /**
   * Check if a point is inside any boundary
   */
  isPointInAnyBoundary(point) {
    for (const boundary of this.boundaries) {
      if (isPointInPolygon(point, boundary)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopDrawing();
    this.clear();
    console.log('[BoundaryEditor] Boundary editor destroyed');
  }
}

export default BoundaryEditor;
