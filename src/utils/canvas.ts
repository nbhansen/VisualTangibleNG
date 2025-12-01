/**
 * Canvas Utility Functions (004-freeform-board)
 *
 * Coordinate transforms, zoom/position clamping, and drag/resize calculations.
 */

import type { Point, Viewport, ButtonPosition, Bounds } from '../types';
import { ZOOM_CONSTRAINTS, SIZE_CONSTRAINTS, DEFAULT_VIEWPORT } from '../types';

// =============================================================================
// Coordinate Transforms
// =============================================================================

/**
 * Convert world coordinates to screen coordinates.
 */
export function worldToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.zoom + viewport.panX,
    y: point.y * viewport.zoom + viewport.panY,
  };
}

/**
 * Convert screen coordinates to world coordinates.
 */
export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.panX) / viewport.zoom,
    y: (point.y - viewport.panY) / viewport.zoom,
  };
}

// =============================================================================
// Clamping Functions
// =============================================================================

/**
 * Clamp zoom to valid range.
 */
export function clampZoom(zoom: number): number {
  return Math.max(ZOOM_CONSTRAINTS.MIN, Math.min(ZOOM_CONSTRAINTS.MAX, zoom));
}

/**
 * Clamp position/size to valid bounds within canvas.
 */
export function clampPosition(
  pos: ButtonPosition,
  canvasWidth: number,
  canvasHeight: number
): ButtonPosition {
  const width = Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, Math.min(SIZE_CONSTRAINTS.MAX_WIDTH, pos.width));
  const height = Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, Math.min(SIZE_CONSTRAINTS.MAX_HEIGHT, pos.height));

  return {
    x: Math.max(0, Math.min(canvasWidth - width, pos.x)),
    y: Math.max(0, Math.min(canvasHeight - height, pos.y)),
    width,
    height,
    zIndex: Math.max(0, pos.zIndex),
  };
}

// =============================================================================
// Drag & Resize Calculations
// =============================================================================

/**
 * Calculate new position during drag.
 */
export function calculateDragPosition(
  originalPosition: ButtonPosition,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  zoom: number
): ButtonPosition {
  const deltaX = (currentX - startX) / zoom;
  const deltaY = (currentY - startY) / zoom;

  return {
    ...originalPosition,
    x: originalPosition.x + deltaX,
    y: originalPosition.y + deltaY,
  };
}

/**
 * Resize handle positions.
 */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Calculate new bounds during resize.
 */
export function calculateResizeBounds(
  originalBounds: ButtonPosition,
  handle: ResizeHandle,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  zoom: number
): ButtonPosition {
  const deltaX = (currentX - startX) / zoom;
  const deltaY = (currentY - startY) / zoom;

  let { x, y, width, height } = originalBounds;
  const { zIndex } = originalBounds;

  // Proportional resize based on handle
  switch (handle) {
    case 'se':
      width += deltaX;
      height += deltaY;
      break;
    case 'sw':
      x += deltaX;
      width -= deltaX;
      height += deltaY;
      break;
    case 'ne':
      y += deltaY;
      width += deltaX;
      height -= deltaY;
      break;
    case 'nw':
      x += deltaX;
      y += deltaY;
      width -= deltaX;
      height -= deltaY;
      break;
  }

  // Enforce minimum size
  if (width < SIZE_CONSTRAINTS.MIN_WIDTH) {
    if (handle === 'nw' || handle === 'sw') {
      x = originalBounds.x + originalBounds.width - SIZE_CONSTRAINTS.MIN_WIDTH;
    }
    width = SIZE_CONSTRAINTS.MIN_WIDTH;
  }
  if (height < SIZE_CONSTRAINTS.MIN_HEIGHT) {
    if (handle === 'nw' || handle === 'ne') {
      y = originalBounds.y + originalBounds.height - SIZE_CONSTRAINTS.MIN_HEIGHT;
    }
    height = SIZE_CONSTRAINTS.MIN_HEIGHT;
  }

  return { x, y, width, height, zIndex };
}

// =============================================================================
// Sorting & Accessibility
// =============================================================================

/**
 * Sort buttons by spatial position for accessibility scan order.
 * Orders top-to-bottom, left-to-right with row tolerance.
 */
export function sortByPosition(
  buttons: Array<{ id: string; position: ButtonPosition }>,
  rowTolerance: number = 50
): string[] {
  return [...buttons]
    .sort((a, b) => {
      const rowA = Math.floor(a.position.y / rowTolerance);
      const rowB = Math.floor(b.position.y / rowTolerance);
      if (rowA !== rowB) return rowA - rowB;
      return a.position.x - b.position.x;
    })
    .map(btn => btn.id);
}

// =============================================================================
// Fit to Content
// =============================================================================

/**
 * Calculate zoom to fit all buttons in view.
 */
export function calculateFitZoom(
  buttons: Bounds[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): Viewport {
  if (buttons.length === 0) {
    return DEFAULT_VIEWPORT;
  }

  // Find bounding box of all buttons
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const btn of buttons) {
    minX = Math.min(minX, btn.x);
    minY = Math.min(minY, btn.y);
    maxX = Math.max(maxX, btn.x + btn.width);
    maxY = Math.max(maxY, btn.y + btn.height);
  }

  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  const scaleX = viewportWidth / contentWidth;
  const scaleY = viewportHeight / contentHeight;
  const zoom = clampZoom(Math.min(scaleX, scaleY));

  // Center the content
  const panX = (viewportWidth - contentWidth * zoom) / 2 - minX * zoom + padding * zoom;
  const panY = (viewportHeight - contentHeight * zoom) / 2 - minY * zoom + padding * zoom;

  return { zoom, panX, panY };
}

// =============================================================================
// Mode Conversion
// =============================================================================

/**
 * Convert grid positions to freeform positions.
 * Places buttons in a grid-like arrangement with the specified cell size.
 */
export function gridToFreeformPositions(
  buttons: Array<{ id: string; position: number }>,
  layout: number,
  canvasWidth: number,
  canvasHeight: number
): Array<{ buttonId: string; position: ButtonPosition }> {
  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(layout));
  const rows = Math.ceil(layout / cols);

  // Calculate cell size based on canvas
  const cellWidth = Math.min(SIZE_CONSTRAINTS.DEFAULT_WIDTH * 2, canvasWidth / cols);
  const cellHeight = Math.min(SIZE_CONSTRAINTS.DEFAULT_HEIGHT * 2, canvasHeight / rows);
  const buttonWidth = SIZE_CONSTRAINTS.DEFAULT_WIDTH;
  const buttonHeight = SIZE_CONSTRAINTS.DEFAULT_HEIGHT;

  // Center the grid on the canvas
  const gridWidth = cols * cellWidth;
  const gridHeight = rows * cellHeight;
  const offsetX = (canvasWidth - gridWidth) / 2;
  const offsetY = (canvasHeight - gridHeight) / 2;

  return buttons.map((btn, index) => {
    const col = btn.position % cols;
    const row = Math.floor(btn.position / cols);

    // Center button within cell
    const x = offsetX + col * cellWidth + (cellWidth - buttonWidth) / 2;
    const y = offsetY + row * cellHeight + (cellHeight - buttonHeight) / 2;

    return {
      buttonId: btn.id,
      position: {
        x,
        y,
        width: buttonWidth,
        height: buttonHeight,
        zIndex: index,
      },
    };
  });
}

/**
 * Convert freeform positions to grid positions.
 * Assigns grid positions based on spatial sort order (top-left to bottom-right).
 */
export function freeformToGridPositions(
  buttons: Array<{ id: string; x: number | null; y: number | null }>
): Array<{ buttonId: string; position: number }> {
  // Filter buttons that have freeform positions
  const positioned = buttons.filter(b => b.x !== null && b.y !== null);
  const unpositioned = buttons.filter(b => b.x === null || b.y === null);

  // Sort positioned buttons by position
  const sortedIds = sortByPosition(
    positioned.map(b => ({
      id: b.id,
      position: { x: b.x!, y: b.y!, width: 0, height: 0, zIndex: 0 },
    }))
  );

  // Assign grid positions in sort order
  const result: Array<{ buttonId: string; position: number }> = [];

  sortedIds.forEach((id, index) => {
    result.push({ buttonId: id, position: index });
  });

  // Add unpositioned buttons at the end
  unpositioned.forEach((btn, index) => {
    result.push({ buttonId: btn.id, position: sortedIds.length + index });
  });

  return result;
}
