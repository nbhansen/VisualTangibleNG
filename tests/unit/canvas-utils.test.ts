/**
 * Canvas Utility Functions Tests (004-freeform-board)
 */

import { describe, it, expect } from 'vitest';
import {
  worldToScreen,
  screenToWorld,
  clampZoom,
  clampPosition,
  calculateDragPosition,
  calculateResizeBounds,
  sortByPosition,
  calculateFitZoom,
  gridToFreeformPositions,
  freeformToGridPositions,
} from '../../src/utils/canvas';
import { ZOOM_CONSTRAINTS, SIZE_CONSTRAINTS, DEFAULT_VIEWPORT } from '../../src/types';
import type { ButtonPosition, Viewport } from '../../src/types';

// =============================================================================
// Coordinate Transforms
// =============================================================================

describe('worldToScreen', () => {
  it('converts world coordinates to screen at zoom 1 with no pan', () => {
    const point = { x: 100, y: 200 };
    const viewport: Viewport = { zoom: 1, panX: 0, panY: 0 };

    const result = worldToScreen(point, viewport);

    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('applies zoom scaling', () => {
    const point = { x: 100, y: 200 };
    const viewport: Viewport = { zoom: 2, panX: 0, panY: 0 };

    const result = worldToScreen(point, viewport);

    expect(result).toEqual({ x: 200, y: 400 });
  });

  it('applies pan offset', () => {
    const point = { x: 100, y: 200 };
    const viewport: Viewport = { zoom: 1, panX: 50, panY: -30 };

    const result = worldToScreen(point, viewport);

    expect(result).toEqual({ x: 150, y: 170 });
  });

  it('combines zoom and pan correctly', () => {
    const point = { x: 100, y: 200 };
    const viewport: Viewport = { zoom: 2, panX: 50, panY: -30 };

    const result = worldToScreen(point, viewport);

    // x: 100 * 2 + 50 = 250
    // y: 200 * 2 + (-30) = 370
    expect(result).toEqual({ x: 250, y: 370 });
  });
});

describe('screenToWorld', () => {
  it('converts screen coordinates to world at zoom 1 with no pan', () => {
    const point = { x: 100, y: 200 };
    const viewport: Viewport = { zoom: 1, panX: 0, panY: 0 };

    const result = screenToWorld(point, viewport);

    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('reverses zoom scaling', () => {
    const point = { x: 200, y: 400 };
    const viewport: Viewport = { zoom: 2, panX: 0, panY: 0 };

    const result = screenToWorld(point, viewport);

    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('reverses pan offset', () => {
    const point = { x: 150, y: 170 };
    const viewport: Viewport = { zoom: 1, panX: 50, panY: -30 };

    const result = screenToWorld(point, viewport);

    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('is inverse of worldToScreen', () => {
    const originalPoint = { x: 123, y: 456 };
    const viewport: Viewport = { zoom: 1.5, panX: 100, panY: -50 };

    const screenPoint = worldToScreen(originalPoint, viewport);
    const result = screenToWorld(screenPoint, viewport);

    expect(result.x).toBeCloseTo(originalPoint.x);
    expect(result.y).toBeCloseTo(originalPoint.y);
  });
});

// =============================================================================
// Clamping Functions
// =============================================================================

describe('clampZoom', () => {
  it('returns value within valid range unchanged', () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it('clamps values below minimum to MIN', () => {
    expect(clampZoom(0.1)).toBe(ZOOM_CONSTRAINTS.MIN);
    expect(clampZoom(0)).toBe(ZOOM_CONSTRAINTS.MIN);
    expect(clampZoom(-1)).toBe(ZOOM_CONSTRAINTS.MIN);
  });

  it('clamps values above maximum to MAX', () => {
    expect(clampZoom(5)).toBe(ZOOM_CONSTRAINTS.MAX);
    expect(clampZoom(100)).toBe(ZOOM_CONSTRAINTS.MAX);
  });

  it('returns exactly MIN and MAX at boundaries', () => {
    expect(clampZoom(ZOOM_CONSTRAINTS.MIN)).toBe(ZOOM_CONSTRAINTS.MIN);
    expect(clampZoom(ZOOM_CONSTRAINTS.MAX)).toBe(ZOOM_CONSTRAINTS.MAX);
  });
});

describe('clampPosition', () => {
  const canvasWidth = 1000;
  const canvasHeight = 800;

  it('returns valid position unchanged', () => {
    const pos: ButtonPosition = { x: 100, y: 100, width: 120, height: 120, zIndex: 5 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result).toEqual(pos);
  });

  it('clamps negative x and y to 0', () => {
    const pos: ButtonPosition = { x: -50, y: -100, width: 120, height: 120, zIndex: 1 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('clamps position to keep button within canvas', () => {
    const pos: ButtonPosition = { x: 950, y: 750, width: 120, height: 120, zIndex: 1 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result.x).toBe(canvasWidth - result.width);
    expect(result.y).toBe(canvasHeight - result.height);
  });

  it('enforces minimum width and height', () => {
    const pos: ButtonPosition = { x: 100, y: 100, width: 10, height: 10, zIndex: 1 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result.width).toBe(SIZE_CONSTRAINTS.MIN_WIDTH);
    expect(result.height).toBe(SIZE_CONSTRAINTS.MIN_HEIGHT);
  });

  it('enforces maximum width and height', () => {
    const pos: ButtonPosition = { x: 100, y: 100, width: 1000, height: 1000, zIndex: 1 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result.width).toBe(SIZE_CONSTRAINTS.MAX_WIDTH);
    expect(result.height).toBe(SIZE_CONSTRAINTS.MAX_HEIGHT);
  });

  it('clamps negative zIndex to 0', () => {
    const pos: ButtonPosition = { x: 100, y: 100, width: 120, height: 120, zIndex: -5 };

    const result = clampPosition(pos, canvasWidth, canvasHeight);

    expect(result.zIndex).toBe(0);
  });
});

// =============================================================================
// Drag & Resize Calculations
// =============================================================================

describe('calculateDragPosition', () => {
  const originalPosition: ButtonPosition = { x: 100, y: 100, width: 120, height: 120, zIndex: 1 };

  it('returns original position when no movement', () => {
    const result = calculateDragPosition(originalPosition, 0, 0, 0, 0, 1);

    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it('calculates new position based on delta at zoom 1', () => {
    const result = calculateDragPosition(originalPosition, 0, 0, 50, 30, 1);

    expect(result.x).toBe(150);
    expect(result.y).toBe(130);
  });

  it('accounts for zoom when calculating delta', () => {
    // At zoom 2, a 100px screen movement = 50px world movement
    const result = calculateDragPosition(originalPosition, 0, 0, 100, 100, 2);

    expect(result.x).toBe(150);
    expect(result.y).toBe(150);
  });

  it('preserves width, height, and zIndex', () => {
    const result = calculateDragPosition(originalPosition, 0, 0, 50, 50, 1);

    expect(result.width).toBe(120);
    expect(result.height).toBe(120);
    expect(result.zIndex).toBe(1);
  });

  it('handles negative movement', () => {
    const result = calculateDragPosition(originalPosition, 100, 100, 50, 50, 1);

    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });
});

describe('calculateResizeBounds', () => {
  const originalBounds: ButtonPosition = { x: 100, y: 100, width: 120, height: 120, zIndex: 1 };

  describe('SE handle (bottom-right)', () => {
    it('increases size when dragging right and down', () => {
      const result = calculateResizeBounds(originalBounds, 'se', 0, 0, 50, 50, 1);

      expect(result.width).toBe(170);
      expect(result.height).toBe(170);
      expect(result.x).toBe(100); // Position unchanged
      expect(result.y).toBe(100);
    });

    it('decreases size when dragging left and up', () => {
      const result = calculateResizeBounds(originalBounds, 'se', 0, 0, -50, -50, 1);

      expect(result.width).toBe(70);
      expect(result.height).toBe(70);
    });
  });

  describe('NW handle (top-left)', () => {
    it('moves position and adjusts size when dragging', () => {
      const result = calculateResizeBounds(originalBounds, 'nw', 0, 0, -50, -50, 1);

      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
      expect(result.width).toBe(170);
      expect(result.height).toBe(170);
    });
  });

  describe('NE handle (top-right)', () => {
    it('moves y position and adjusts size', () => {
      const result = calculateResizeBounds(originalBounds, 'ne', 0, 0, 50, -50, 1);

      expect(result.x).toBe(100); // x unchanged
      expect(result.y).toBe(50);
      expect(result.width).toBe(170);
      expect(result.height).toBe(170);
    });
  });

  describe('SW handle (bottom-left)', () => {
    it('moves x position and adjusts size', () => {
      const result = calculateResizeBounds(originalBounds, 'sw', 0, 0, -50, 50, 1);

      expect(result.x).toBe(50);
      expect(result.y).toBe(100); // y unchanged
      expect(result.width).toBe(170);
      expect(result.height).toBe(170);
    });
  });

  it('enforces minimum width', () => {
    const result = calculateResizeBounds(originalBounds, 'se', 0, 0, -200, 0, 1);

    expect(result.width).toBe(SIZE_CONSTRAINTS.MIN_WIDTH);
  });

  it('enforces minimum height', () => {
    const result = calculateResizeBounds(originalBounds, 'se', 0, 0, 0, -200, 1);

    expect(result.height).toBe(SIZE_CONSTRAINTS.MIN_HEIGHT);
  });

  it('adjusts position when hitting minimum size from NW', () => {
    const result = calculateResizeBounds(originalBounds, 'nw', 0, 0, 200, 200, 1);

    expect(result.width).toBe(SIZE_CONSTRAINTS.MIN_WIDTH);
    expect(result.height).toBe(SIZE_CONSTRAINTS.MIN_HEIGHT);
    // Position should be adjusted to keep bottom-right corner fixed
    expect(result.x).toBe(originalBounds.x + originalBounds.width - SIZE_CONSTRAINTS.MIN_WIDTH);
    expect(result.y).toBe(originalBounds.y + originalBounds.height - SIZE_CONSTRAINTS.MIN_HEIGHT);
  });

  it('accounts for zoom', () => {
    // At zoom 2, 100px screen movement = 50px world movement
    const result = calculateResizeBounds(originalBounds, 'se', 0, 0, 100, 100, 2);

    expect(result.width).toBe(170);
    expect(result.height).toBe(170);
  });

  it('preserves zIndex', () => {
    const result = calculateResizeBounds(originalBounds, 'se', 0, 0, 50, 50, 1);

    expect(result.zIndex).toBe(1);
  });
});

// =============================================================================
// Sorting & Accessibility
// =============================================================================

describe('sortByPosition', () => {
  it('returns empty array for empty input', () => {
    const result = sortByPosition([]);

    expect(result).toEqual([]);
  });

  it('sorts buttons left to right within a row', () => {
    const buttons = [
      { id: 'c', position: { x: 200, y: 0, width: 100, height: 100, zIndex: 0 } },
      { id: 'a', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
      { id: 'b', position: { x: 100, y: 0, width: 100, height: 100, zIndex: 0 } },
    ];

    const result = sortByPosition(buttons);

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('sorts buttons top to bottom across rows', () => {
    const buttons = [
      { id: 'bottom', position: { x: 0, y: 100, width: 100, height: 100, zIndex: 0 } },
      { id: 'top', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
    ];

    const result = sortByPosition(buttons);

    expect(result).toEqual(['top', 'bottom']);
  });

  it('groups buttons within row tolerance', () => {
    // With default tolerance of 50, buttons at y=0 and y=40 should be same row
    const buttons = [
      { id: 'b', position: { x: 100, y: 40, width: 100, height: 100, zIndex: 0 } },
      { id: 'a', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
    ];

    const result = sortByPosition(buttons, 50);

    expect(result).toEqual(['a', 'b']);
  });

  it('respects custom row tolerance', () => {
    const buttons = [
      { id: 'b', position: { x: 100, y: 40, width: 100, height: 100, zIndex: 0 } },
      { id: 'a', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
    ];

    // With tolerance of 30, y=0 and y=40 are different rows
    const result = sortByPosition(buttons, 30);

    expect(result).toEqual(['a', 'b']); // Still a first because row 0 < row 1
  });

  it('handles grid-like arrangement', () => {
    const buttons = [
      { id: 'd', position: { x: 100, y: 100, width: 100, height: 100, zIndex: 0 } },
      { id: 'b', position: { x: 100, y: 0, width: 100, height: 100, zIndex: 0 } },
      { id: 'c', position: { x: 0, y: 100, width: 100, height: 100, zIndex: 0 } },
      { id: 'a', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
    ];

    const result = sortByPosition(buttons, 50);

    // Row 0: a, b; Row 1: c, d
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });
});

// =============================================================================
// Fit to Content
// =============================================================================

describe('calculateFitZoom', () => {
  it('returns default viewport for empty buttons array', () => {
    const result = calculateFitZoom([], 800, 600);

    expect(result).toEqual(DEFAULT_VIEWPORT);
  });

  it('calculates viewport to fit single button', () => {
    const buttons = [{ x: 100, y: 100, width: 200, height: 200 }];

    const result = calculateFitZoom(buttons, 800, 600);

    // Should be zoomed to fit and centered
    expect(result.zoom).toBeGreaterThan(0);
    expect(result.zoom).toBeLessThanOrEqual(ZOOM_CONSTRAINTS.MAX);
  });

  it('clamps zoom to valid range', () => {
    // Very small content in large viewport would want zoom > MAX
    const buttons = [{ x: 0, y: 0, width: 10, height: 10 }];

    const result = calculateFitZoom(buttons, 10000, 10000);

    expect(result.zoom).toBeLessThanOrEqual(ZOOM_CONSTRAINTS.MAX);
  });

  it('handles multiple buttons spread across canvas', () => {
    const buttons = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 500, y: 0, width: 100, height: 100 },
      { x: 0, y: 400, width: 100, height: 100 },
      { x: 500, y: 400, width: 100, height: 100 },
    ];

    const result = calculateFitZoom(buttons, 800, 600);

    expect(result.zoom).toBeGreaterThan(0);
    expect(typeof result.panX).toBe('number');
    expect(typeof result.panY).toBe('number');
  });
});

// =============================================================================
// Mode Conversion
// =============================================================================

describe('gridToFreeformPositions', () => {
  it('converts grid positions to freeform coordinates', () => {
    const buttons = [
      { id: 'btn1', position: 0 },
      { id: 'btn2', position: 1 },
    ];

    const result = gridToFreeformPositions(buttons, 4, 1000, 800);

    expect(result).toHaveLength(2);
    expect(result[0].buttonId).toBe('btn1');
    expect(result[1].buttonId).toBe('btn2');

    // Each should have valid position
    result.forEach(r => {
      expect(r.position.x).toBeGreaterThanOrEqual(0);
      expect(r.position.y).toBeGreaterThanOrEqual(0);
      expect(r.position.width).toBe(SIZE_CONSTRAINTS.DEFAULT_WIDTH);
      expect(r.position.height).toBe(SIZE_CONSTRAINTS.DEFAULT_HEIGHT);
    });
  });

  it('assigns sequential zIndex values', () => {
    const buttons = [
      { id: 'btn1', position: 0 },
      { id: 'btn2', position: 1 },
      { id: 'btn3', position: 2 },
    ];

    const result = gridToFreeformPositions(buttons, 4, 1000, 800);

    expect(result[0].position.zIndex).toBe(0);
    expect(result[1].position.zIndex).toBe(1);
    expect(result[2].position.zIndex).toBe(2);
  });

  it('positions buttons in grid-like arrangement', () => {
    const buttons = [
      { id: 'btn1', position: 0 },
      { id: 'btn2', position: 1 },
      { id: 'btn3', position: 2 },
      { id: 'btn4', position: 3 },
    ];

    const result = gridToFreeformPositions(buttons, 4, 1000, 800);

    // Button 0 and 1 should be in same row (same y)
    expect(result[0].position.y).toBe(result[1].position.y);
    // Button 0 should be left of button 1
    expect(result[0].position.x).toBeLessThan(result[1].position.x);
  });
});

describe('freeformToGridPositions', () => {
  it('converts freeform positions to grid indices based on spatial order', () => {
    const buttons = [
      { id: 'topRight', x: 200, y: 0 },
      { id: 'topLeft', x: 0, y: 0 },
      { id: 'bottom', x: 0, y: 100 },
    ];

    const result = freeformToGridPositions(buttons);

    // Should be sorted: topLeft (0), topRight (1), bottom (2)
    expect(result.find(r => r.buttonId === 'topLeft')?.position).toBe(0);
    expect(result.find(r => r.buttonId === 'topRight')?.position).toBe(1);
    expect(result.find(r => r.buttonId === 'bottom')?.position).toBe(2);
  });

  it('handles buttons without positions (null x/y)', () => {
    const buttons = [
      { id: 'positioned', x: 0, y: 0 },
      { id: 'unpositioned', x: null, y: null },
    ];

    const result = freeformToGridPositions(buttons);

    expect(result).toHaveLength(2);
    // Positioned button comes first
    expect(result.find(r => r.buttonId === 'positioned')?.position).toBe(0);
    // Unpositioned button comes after
    expect(result.find(r => r.buttonId === 'unpositioned')?.position).toBe(1);
  });

  it('returns all buttons with assigned positions', () => {
    const buttons = [
      { id: 'a', x: 100, y: 100 },
      { id: 'b', x: 0, y: 0 },
      { id: 'c', x: null, y: null },
    ];

    const result = freeformToGridPositions(buttons);

    expect(result).toHaveLength(3);
    expect(result.map(r => r.buttonId).sort()).toEqual(['a', 'b', 'c']);
  });

  it('handles empty array', () => {
    const result = freeformToGridPositions([]);

    expect(result).toEqual([]);
  });
});
