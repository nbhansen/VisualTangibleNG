/**
 * BoardCanvas Component (004-freeform-board)
 *
 * Freeform canvas container for draggable buttons with pan/zoom support.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ButtonWithMedia, ButtonPosition, LabelPosition, Viewport, Bounds } from '../../types';
import { SIZE_CONSTRAINTS, MAX_BUTTONS, DEFAULT_VIEWPORT } from '../../types';
import { DraggableButton } from './DraggableButton';
import { screenToWorld, clampZoom, calculateFitZoom } from '../../utils/canvas';
import { getStorageService } from '../../services/storage/StorageService';
import './BoardCanvas.css';

interface BoardCanvasProps {
  buttons: ButtonWithMedia[];
  boardId: string;
  canvasWidth: number;
  canvasHeight: number;
  initialViewport: Viewport;
  isEditing: boolean;
  onButtonTap: (button: ButtonWithMedia) => void;
  onButtonSelect?: (button: ButtonWithMedia) => void;
  selectedButtonId?: string | null;
  labelPosition?: LabelPosition;
  playingButtonId?: string | null;
  progress?: number;
  onButtonsChange?: () => void;
}

export function BoardCanvas({
  buttons,
  boardId,
  canvasWidth,
  canvasHeight,
  initialViewport,
  isEditing,
  onButtonTap,
  onButtonSelect,
  selectedButtonId = null,
  labelPosition = 'below',
  playingButtonId = null,
  progress = 0,
  onButtonsChange,
}: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedButtonId);

  // Track pointers for pan/zoom
  const pointerMapRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const didMoveRef = useRef(false);
  const lastPinchDistanceRef = useRef<number | null>(null);

  // Debounce viewport persistence
  const viewportSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync selected ID from props
  useEffect(() => {
    setLocalSelectedId(selectedButtonId);
  }, [selectedButtonId]);

  /**
   * Get button position, converting from stored values or generating defaults
   */
  const getButtonPosition = useCallback(
    (button: ButtonWithMedia, index: number): ButtonPosition => {
      if (button.x !== null && button.y !== null && button.width !== null && button.height !== null) {
        return {
          x: button.x,
          y: button.y,
          width: button.width,
          height: button.height,
          zIndex: button.zIndex ?? index,
        };
      }
      // Default position for buttons without freeform data
      const cols = 4;
      const cellWidth = canvasWidth / cols;
      const cellHeight = canvasHeight / 4;
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        x: col * cellWidth + (cellWidth - SIZE_CONSTRAINTS.DEFAULT_WIDTH) / 2,
        y: row * cellHeight + (cellHeight - SIZE_CONSTRAINTS.DEFAULT_HEIGHT) / 2,
        width: SIZE_CONSTRAINTS.DEFAULT_WIDTH,
        height: SIZE_CONSTRAINTS.DEFAULT_HEIGHT,
        zIndex: index,
      };
    },
    [canvasWidth, canvasHeight]
  );

  /**
   * Handle button position change
   */
  const handlePositionChange = useCallback(
    async (buttonId: string, position: ButtonPosition) => {
      const storageService = getStorageService();
      await storageService.updateButtonPosition(buttonId, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      });
      await storageService.updateButtonZIndex(buttonId, position.zIndex);
      onButtonsChange?.();
    },
    [onButtonsChange]
  );

  /**
   * Handle button selection
   */
  const handleSelect = useCallback(
    (button: ButtonWithMedia) => {
      setLocalSelectedId(button.id);
      onButtonSelect?.(button);
    },
    [onButtonSelect]
  );

  /**
   * Handle canvas tap to add new button (freeform edit mode only)
   */
  const handleCanvasTap = useCallback(
    async (e: React.PointerEvent) => {
      // Only in edit mode, and only if clicking on empty space
      if (!isEditing) return;
      if ((e.target as HTMLElement).closest('.draggable-button')) return;

      // Check button limit
      if (buttons.length >= MAX_BUTTONS) {
        // TODO: Show toast message
        console.warn(`Maximum buttons (${MAX_BUTTONS}) reached`);
        return;
      }

      // Get container bounds
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      // Convert screen position to world coordinates
      const screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const worldPos = screenToWorld(screenPos, viewport);

      // Calculate max zIndex
      const maxZIndex = buttons.reduce((max, btn) => Math.max(max, btn.zIndex ?? 0), 0);

      // Create new button at position
      const position: ButtonPosition = {
        x: worldPos.x - SIZE_CONSTRAINTS.DEFAULT_WIDTH / 2,
        y: worldPos.y - SIZE_CONSTRAINTS.DEFAULT_HEIGHT / 2,
        width: SIZE_CONSTRAINTS.DEFAULT_WIDTH,
        height: SIZE_CONSTRAINTS.DEFAULT_HEIGHT,
        zIndex: maxZIndex + 1,
      };

      // Clamp to canvas bounds
      position.x = Math.max(0, Math.min(canvasWidth - position.width, position.x));
      position.y = Math.max(0, Math.min(canvasHeight - position.height, position.y));

      const storageService = getStorageService();
      await storageService.createButtonWithPosition(boardId, position);
      onButtonsChange?.();
    },
    [isEditing, buttons, boardId, viewport, canvasWidth, canvasHeight, onButtonsChange]
  );

  /**
   * Handle pan start (single pointer on empty space)
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      didMoveRef.current = false;

      // Only start pan if not on a button and single pointer
      if (
        pointerMapRef.current.size === 1 &&
        !(e.target as HTMLElement).closest('.draggable-button')
      ) {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    },
    []
  );

  /**
   * Handle pan/zoom move
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Update pointer position
      if (pointerMapRef.current.has(e.pointerId)) {
        pointerMapRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Handle single-pointer pan
      if (isPanningRef.current && pointerMapRef.current.size === 1) {
        const deltaX = e.clientX - lastPanPosRef.current.x;
        const deltaY = e.clientY - lastPanPosRef.current.y;

        // Track if we moved significantly (more than 5px)
        const totalDeltaX = e.clientX - pointerStartRef.current.x;
        const totalDeltaY = e.clientY - pointerStartRef.current.y;
        if (Math.abs(totalDeltaX) > 5 || Math.abs(totalDeltaY) > 5) {
          didMoveRef.current = true;
        }

        lastPanPosRef.current = { x: e.clientX, y: e.clientY };

        setViewport((prev) => ({
          ...prev,
          panX: prev.panX + deltaX,
          panY: prev.panY + deltaY,
        }));
      }

      // Handle two-pointer pinch zoom
      if (pointerMapRef.current.size === 2) {
        const pointers = Array.from(pointerMapRef.current.values());
        const [p1, p2] = pointers;

        // Calculate current pinch distance
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        // Calculate pinch center (screen coordinates)
        const centerX = (p1.x + p2.x) / 2;
        const centerY = (p1.y + p2.y) / 2;

        // Get container offset
        const container = containerRef.current;
        const rect = container?.getBoundingClientRect();
        const localCenterX = rect ? centerX - rect.left : centerX;
        const localCenterY = rect ? centerY - rect.top : centerY;

        if (lastPinchDistanceRef.current !== null) {
          const scale = currentDistance / lastPinchDistanceRef.current;

          setViewport((prev) => {
            const newZoom = clampZoom(prev.zoom * scale);
            const actualScale = newZoom / prev.zoom;

            // Adjust pan to keep pinch center stationary
            const newPanX = localCenterX - (localCenterX - prev.panX) * actualScale;
            const newPanY = localCenterY - (localCenterY - prev.panY) * actualScale;

            return {
              zoom: newZoom,
              panX: newPanX,
              panY: newPanY,
            };
          });

          didMoveRef.current = true;
        }

        lastPinchDistanceRef.current = currentDistance;
      } else {
        lastPinchDistanceRef.current = null;
      }
    },
    []
  );

  /**
   * Handle pan end
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasFirstPointer = pointerMapRef.current.size === 1;
      pointerMapRef.current.delete(e.pointerId);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

      if (pointerMapRef.current.size === 0) {
        // If this was a tap (no significant movement), trigger canvas tap
        if (wasFirstPointer && !didMoveRef.current) {
          handleCanvasTap(e);
        }

        isPanningRef.current = false;
        lastPinchDistanceRef.current = null;

        // Debounce viewport persistence
        if (viewportSaveTimeoutRef.current) {
          clearTimeout(viewportSaveTimeoutRef.current);
        }
        viewportSaveTimeoutRef.current = setTimeout(async () => {
          const storageService = getStorageService();
          await storageService.updateBoardViewport(boardId, viewport);
        }, 500);
      }
    },
    [boardId, viewport, handleCanvasTap]
  );

  /**
   * Handle "Fit All" button to fit all buttons in view
   */
  const handleFitAll = useCallback(() => {
    if (buttons.length === 0) {
      setViewport(DEFAULT_VIEWPORT);
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Convert buttons to Bounds array
    const bounds: Bounds[] = buttons.map((button, index) => {
      const pos = getButtonPosition(button, index);
      return {
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
      };
    });

    // Calculate viewport to fit all content
    const newViewport = calculateFitZoom(bounds, rect.width, rect.height);
    setViewport(newViewport);
  }, [buttons, getButtonPosition]);

  // Sort buttons by position for accessibility
  const sortedButtons = [...buttons].sort((a, b) => {
    const posA = getButtonPosition(a, buttons.indexOf(a));
    const posB = getButtonPosition(b, buttons.indexOf(b));
    // Sort by row then column
    const rowA = Math.floor(posA.y / 50);
    const rowB = Math.floor(posB.y / 50);
    if (rowA !== rowB) return rowA - rowB;
    return posA.x - posB.x;
  });

  return (
    <div
      ref={containerRef}
      className="board-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div
        className="board-canvas__content"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {sortedButtons.map((button, index) => {
          const position = getButtonPosition(button, buttons.indexOf(button));
          return (
            <DraggableButton
              key={button.id}
              button={button}
              position={position}
              isSelected={localSelectedId === button.id}
              isEditing={isEditing}
              zoom={viewport.zoom}
              onPositionChange={(pos) => handlePositionChange(button.id, pos)}
              onSelect={() => handleSelect(button)}
              onTap={() => onButtonTap(button)}
              tabIndex={index}
              labelPosition={labelPosition}
              isPlaying={playingButtonId === button.id}
              progress={playingButtonId === button.id ? progress : 0}
            />
          );
        })}
      </div>

      {/* Fit All button - floating control */}
      <button
        className="board-canvas__fit-all"
        onClick={handleFitAll}
        aria-label="Fit all buttons in view"
        title="Fit All"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </button>
    </div>
  );
}
