/**
 * useDraggable Hook (004-freeform-board)
 *
 * Manages drag and resize state for freeform button positioning.
 */

import { useState, useCallback, useRef } from 'react';
import type { ButtonPosition } from '../types';
import { SIZE_CONSTRAINTS } from '../types';
import { calculateDragPosition, calculateResizeBounds, type ResizeHandle } from '../utils/canvas';

/**
 * Drag state during a drag operation.
 */
export interface DragState {
  isDragging: boolean;
  buttonId: string | null;
  startX: number;
  startY: number;
  originalPosition: ButtonPosition | null;
}

/**
 * Resize state during a resize operation.
 */
export interface ResizeState {
  isResizing: boolean;
  buttonId: string | null;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  originalBounds: ButtonPosition | null;
}

const initialDragState: DragState = {
  isDragging: false,
  buttonId: null,
  startX: 0,
  startY: 0,
  originalPosition: null,
};

const initialResizeState: ResizeState = {
  isResizing: false,
  buttonId: null,
  handle: null,
  startX: 0,
  startY: 0,
  originalBounds: null,
};

export interface UseDraggableOptions {
  /** Current zoom level for coordinate scaling */
  zoom: number;
  /** Canvas width for boundary clamping */
  canvasWidth: number;
  /** Canvas height for boundary clamping */
  canvasHeight: number;
}

export interface UseDraggableReturn {
  dragState: DragState;
  resizeState: ResizeState;
  startDrag: (buttonId: string, clientX: number, clientY: number, position: ButtonPosition) => void;
  startResize: (buttonId: string, handle: ResizeHandle, clientX: number, clientY: number, position: ButtonPosition) => void;
  handleMove: (clientX: number, clientY: number) => ButtonPosition | null;
  endOperation: () => ButtonPosition | null;
  cancel: () => void;
}

export function useDraggable(options: UseDraggableOptions): UseDraggableReturn {
  const { zoom, canvasWidth, canvasHeight } = options;

  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [resizeState, setResizeState] = useState<ResizeState>(initialResizeState);

  // Use refs for current position during operations to avoid stale closures
  const currentPositionRef = useRef<ButtonPosition | null>(null);

  /**
   * Start a drag operation
   */
  const startDrag = useCallback(
    (buttonId: string, clientX: number, clientY: number, position: ButtonPosition) => {
      setDragState({
        isDragging: true,
        buttonId,
        startX: clientX,
        startY: clientY,
        originalPosition: position,
      });
      currentPositionRef.current = position;
    },
    []
  );

  /**
   * Start a resize operation
   */
  const startResize = useCallback(
    (buttonId: string, handle: ResizeHandle, clientX: number, clientY: number, position: ButtonPosition) => {
      setResizeState({
        isResizing: true,
        buttonId,
        handle,
        startX: clientX,
        startY: clientY,
        originalBounds: position,
      });
      currentPositionRef.current = position;
    },
    []
  );

  /**
   * Handle pointer move during drag or resize
   */
  const handleMove = useCallback(
    (clientX: number, clientY: number): ButtonPosition | null => {
      if (dragState.isDragging && dragState.originalPosition) {
        const newPosition = calculateDragPosition(
          dragState.originalPosition,
          dragState.startX,
          dragState.startY,
          clientX,
          clientY,
          zoom
        );

        // Clamp to canvas bounds
        const clampedPosition: ButtonPosition = {
          ...newPosition,
          x: Math.max(0, Math.min(canvasWidth - newPosition.width, newPosition.x)),
          y: Math.max(0, Math.min(canvasHeight - newPosition.height, newPosition.y)),
        };

        currentPositionRef.current = clampedPosition;
        return clampedPosition;
      }

      if (resizeState.isResizing && resizeState.originalBounds && resizeState.handle) {
        const newBounds = calculateResizeBounds(
          resizeState.originalBounds,
          resizeState.handle,
          resizeState.startX,
          resizeState.startY,
          clientX,
          clientY,
          zoom
        );

        // Clamp to constraints and canvas
        const clampedBounds: ButtonPosition = {
          ...newBounds,
          x: Math.max(0, newBounds.x),
          y: Math.max(0, newBounds.y),
          width: Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, Math.min(SIZE_CONSTRAINTS.MAX_WIDTH, newBounds.width)),
          height: Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, Math.min(SIZE_CONSTRAINTS.MAX_HEIGHT, newBounds.height)),
        };

        // Ensure button stays within canvas
        if (clampedBounds.x + clampedBounds.width > canvasWidth) {
          clampedBounds.x = canvasWidth - clampedBounds.width;
        }
        if (clampedBounds.y + clampedBounds.height > canvasHeight) {
          clampedBounds.y = canvasHeight - clampedBounds.height;
        }

        currentPositionRef.current = clampedBounds;
        return clampedBounds;
      }

      return null;
    },
    [dragState, resizeState, zoom, canvasWidth, canvasHeight]
  );

  /**
   * End the current operation and return final position
   */
  const endOperation = useCallback((): ButtonPosition | null => {
    const finalPosition = currentPositionRef.current;

    setDragState(initialDragState);
    setResizeState(initialResizeState);
    currentPositionRef.current = null;

    return finalPosition;
  }, []);

  /**
   * Cancel the current operation without saving
   */
  const cancel = useCallback(() => {
    setDragState(initialDragState);
    setResizeState(initialResizeState);
    currentPositionRef.current = null;
  }, []);

  return {
    dragState,
    resizeState,
    startDrag,
    startResize,
    handleMove,
    endOperation,
    cancel,
  };
}
