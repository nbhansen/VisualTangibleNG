/**
 * useCanvas Hook (004-freeform-board)
 *
 * Manages viewport state for pan/zoom operations on the freeform canvas.
 */

import { useState, useCallback, useRef } from 'react';
import type { Viewport, ButtonWithMedia, Bounds } from '../types';
import { DEFAULT_VIEWPORT } from '../types';
import { clampZoom, calculateFitZoom } from '../utils/canvas';

export interface UseCanvasOptions {
  /** Initial viewport state */
  initialViewport: Viewport;
  /** Callback when viewport changes */
  onViewportChange?: (viewport: Viewport) => void;
}

export interface UseCanvasReturn {
  viewport: Viewport;
  /** Pan by delta in screen coordinates */
  pan: (deltaX: number, deltaY: number) => void;
  /** Zoom at a specific point (screen coordinates) */
  zoomAt: (factor: number, centerX: number, centerY: number) => void;
  /** Fit all content in the viewport */
  fitToContent: (buttons: ButtonWithMedia[], containerWidth: number, containerHeight: number) => void;
  /** Reset to default viewport */
  reset: () => void;
  /** Set viewport directly */
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
}

export function useCanvas(options: UseCanvasOptions): UseCanvasReturn {
  const { initialViewport, onViewportChange } = options;

  const [viewport, setViewportState] = useState<Viewport>(initialViewport);

  // Ref for debounced callback
  const viewportRef = useRef<Viewport>(viewport);

  const setViewport: React.Dispatch<React.SetStateAction<Viewport>> = useCallback(
    (action) => {
      setViewportState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        viewportRef.current = next;
        onViewportChange?.(next);
        return next;
      });
    },
    [onViewportChange]
  );

  /**
   * Pan by delta in screen coordinates
   */
  const pan = useCallback(
    (deltaX: number, deltaY: number) => {
      setViewport((prev) => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
      }));
    },
    [setViewport]
  );

  /**
   * Zoom at a specific point (screen coordinates)
   * This keeps the point under the cursor/finger stationary
   */
  const zoomAt = useCallback(
    (factor: number, centerX: number, centerY: number) => {
      setViewport((prev) => {
        const newZoom = clampZoom(prev.zoom * factor);
        const actualFactor = newZoom / prev.zoom;

        // Adjust pan so the point under centerX/centerY stays stationary
        // The point in world coordinates before zoom:
        // worldX = (centerX - panX) / zoom
        // After zoom, we want the same world point at centerX:
        // centerX = worldX * newZoom + newPanX
        // newPanX = centerX - worldX * newZoom
        // newPanX = centerX - (centerX - panX) / zoom * newZoom
        // newPanX = centerX - (centerX - panX) * actualFactor

        const newPanX = centerX - (centerX - prev.panX) * actualFactor;
        const newPanY = centerY - (centerY - prev.panY) * actualFactor;

        return {
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY,
        };
      });
    },
    [setViewport]
  );

  /**
   * Fit all content in the viewport with padding
   */
  const fitToContent = useCallback(
    (buttons: ButtonWithMedia[], containerWidth: number, containerHeight: number) => {
      if (buttons.length === 0) {
        // No buttons, reset to default
        setViewport(DEFAULT_VIEWPORT);
        return;
      }

      // Convert buttons to Bounds array
      const bounds: Bounds[] = buttons.map((button) => ({
        x: button.x ?? 0,
        y: button.y ?? 0,
        width: button.width ?? 100,
        height: button.height ?? 100,
      }));

      // Calculate viewport to fit all content
      const newViewport = calculateFitZoom(bounds, containerWidth, containerHeight);

      setViewport(newViewport);
    },
    [setViewport]
  );

  /**
   * Reset to default viewport (zoom 1, centered)
   */
  const reset = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, [setViewport]);

  return {
    viewport,
    pan,
    zoomAt,
    fitToContent,
    reset,
    setViewport,
  };
}
