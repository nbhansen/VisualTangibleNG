/**
 * Button Positioning Contracts
 *
 * Types for button position, size, and drag/resize operations.
 */

/**
 * Button position and size for freeform mode.
 */
export interface ButtonPosition {
  /** X position in world coordinates */
  x: number;

  /** Y position in world coordinates */
  y: number;

  /** Width in world units */
  width: number;

  /** Height in world units */
  height: number;

  /** Stacking order (higher = front) */
  zIndex: number;
}

/**
 * Size constraints for buttons.
 */
export const SIZE_CONSTRAINTS = {
  MIN_WIDTH: 44,
  MIN_HEIGHT: 44,
  MAX_WIDTH: 500,
  MAX_HEIGHT: 500,
  DEFAULT_WIDTH: 120,
  DEFAULT_HEIGHT: 120,
} as const;

/**
 * Validate button position/size.
 */
export function isValidPosition(pos: ButtonPosition): boolean {
  return (
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.width >= SIZE_CONSTRAINTS.MIN_WIDTH &&
    pos.height >= SIZE_CONSTRAINTS.MIN_HEIGHT &&
    pos.width <= SIZE_CONSTRAINTS.MAX_WIDTH &&
    pos.height <= SIZE_CONSTRAINTS.MAX_HEIGHT &&
    pos.zIndex >= 0
  );
}

/**
 * Clamp position/size to valid bounds.
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

/**
 * Resize handle positions.
 */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

/**
 * Drag state during a drag operation.
 */
export interface DragState {
  /** Whether currently dragging */
  isDragging: boolean;

  /** ID of button being dragged */
  buttonId: string | null;

  /** Starting X position (screen coords) */
  startX: number;

  /** Starting Y position (screen coords) */
  startY: number;

  /** Original button position */
  originalPosition: ButtonPosition | null;
}

/**
 * Resize state during a resize operation.
 */
export interface ResizeState {
  /** Whether currently resizing */
  isResizing: boolean;

  /** ID of button being resized */
  buttonId: string | null;

  /** Which handle is being dragged */
  handle: ResizeHandle | null;

  /** Starting pointer position */
  startX: number;
  startY: number;

  /** Original button bounds */
  originalBounds: ButtonPosition | null;
}

/**
 * Props for draggable button component.
 */
export interface DraggableButtonProps {
  /** Button ID */
  id: string;

  /** Current position */
  position: ButtonPosition;

  /** Whether button is selected */
  isSelected: boolean;

  /** Whether editing is enabled */
  isEditing: boolean;

  /** Callback when position changes */
  onPositionChange: (position: ButtonPosition) => void;

  /** Callback when button is selected */
  onSelect: () => void;

  /** Callback when button is clicked (audio play) */
  onClick: () => void;

  /** Children (button content) */
  children: React.ReactNode;
}

/**
 * Return type for useDraggable hook.
 */
export interface UseDraggableReturn {
  /** Current drag state */
  dragState: DragState;

  /** Current resize state */
  resizeState: ResizeState;

  /** Start dragging */
  startDrag: (buttonId: string, e: PointerEvent, position: ButtonPosition) => void;

  /** Start resizing */
  startResize: (buttonId: string, handle: ResizeHandle, e: PointerEvent, position: ButtonPosition) => void;

  /** Handle pointer move during drag/resize */
  handleMove: (e: PointerEvent) => ButtonPosition | null;

  /** End drag/resize operation */
  endOperation: () => ButtonPosition | null;

  /** Cancel operation without saving */
  cancel: () => void;
}

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

  let { x, y, width, height, zIndex } = originalBounds;

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
