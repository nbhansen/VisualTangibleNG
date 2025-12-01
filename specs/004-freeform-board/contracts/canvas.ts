/**
 * Canvas and Viewport Contracts
 *
 * Types for the freeform canvas implementation.
 */

/**
 * Board layout mode.
 */
export type BoardMode = 'grid' | 'freeform';

/**
 * Viewport state for canvas navigation.
 */
export interface Viewport {
  /** Zoom level (0.5 to 2.0) */
  zoom: number;

  /** X translation in screen coordinates */
  panX: number;

  /** Y translation in screen coordinates */
  panY: number;
}

/**
 * Canvas configuration.
 */
export interface CanvasConfig {
  /** Virtual canvas width in world coordinates */
  width: number;

  /** Virtual canvas height in world coordinates */
  height: number;
}

/**
 * Default viewport state.
 */
export const DEFAULT_VIEWPORT: Viewport = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

/**
 * Default canvas configuration.
 */
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1920,
  height: 1080,
};

/**
 * Zoom constraints.
 */
export const ZOOM_CONSTRAINTS = {
  MIN: 0.5,
  MAX: 2.0,
  STEP: 0.1,
} as const;

/**
 * Point in 2D space.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle bounds.
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

/**
 * Clamp zoom to valid range.
 */
export function clampZoom(zoom: number): number {
  return Math.max(ZOOM_CONSTRAINTS.MIN, Math.min(ZOOM_CONSTRAINTS.MAX, zoom));
}

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

/**
 * Props for canvas component.
 */
export interface CanvasProps {
  /** Current viewport state */
  viewport: Viewport;

  /** Callback when viewport changes */
  onViewportChange: (viewport: Viewport) => void;

  /** Whether canvas is in edit mode */
  isEditing: boolean;

  /** Children (buttons) to render */
  children: React.ReactNode;
}

/**
 * Return type for useCanvas hook.
 */
export interface UseCanvasReturn {
  /** Current viewport */
  viewport: Viewport;

  /** Set viewport directly */
  setViewport: (viewport: Viewport) => void;

  /** Pan by delta */
  pan: (deltaX: number, deltaY: number) => void;

  /** Zoom by factor, centered on point */
  zoomAt: (factor: number, centerX: number, centerY: number) => void;

  /** Fit all content in view */
  fitToContent: () => void;

  /** Reset to default viewport */
  reset: () => void;
}
