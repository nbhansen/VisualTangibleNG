/**
 * DraggableButton Component (004-freeform-board)
 *
 * A button that can be dragged and resized in freeform mode.
 * Wraps BoardButton with drag/resize capabilities.
 */

import { useCallback, useRef, useState } from 'react';
import type { ButtonWithMedia, ButtonPosition, LabelPosition } from '../../types';
import { SIZE_CONSTRAINTS } from '../../types';
import { BoardButton } from './BoardButton';
import type { ResizeHandle } from '../../utils/canvas';
import './DraggableButton.css';

interface DraggableButtonProps {
  button: ButtonWithMedia;
  position: ButtonPosition;
  isSelected: boolean;
  isEditing: boolean;
  zoom: number;
  onPositionChange: (position: ButtonPosition) => void;
  onSelect: () => void;
  onTap: () => void;
  tabIndex?: number;
  labelPosition?: LabelPosition;
  // Audio feedback props
  isPlaying?: boolean;
  progress?: number;
}

export function DraggableButton({
  button,
  position,
  isSelected,
  isEditing,
  zoom,
  onPositionChange,
  onSelect,
  onTap,
  tabIndex = 0,
  labelPosition = 'below',
  isPlaying = false,
  progress = 0,
}: DraggableButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragPosition, setDragPosition] = useState<ButtonPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  // Track start position for drag calculations
  const startPosRef = useRef({ x: 0, y: 0 });
  const originalPosRef = useRef<ButtonPosition>(position);

  // Use drag position during operation, otherwise use prop position
  const localPosition = (isDragging || isResizing) && dragPosition ? dragPosition : position;

  /**
   * Handle pointer down on the button (start drag)
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isEditing) {
        // In view mode, just play audio
        onTap();
        return;
      }

      // Select the button
      onSelect();

      // Don't start drag on resize handles
      if ((e.target as HTMLElement).closest('.resize-handle')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Capture pointer for smooth dragging
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragPosition(localPosition);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      originalPosRef.current = localPosition;
    },
    [isEditing, onTap, onSelect, localPosition]
  );

  /**
   * Handle pointer move during drag
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging && !isResizing) return;

      e.preventDefault();

      const deltaX = (e.clientX - startPosRef.current.x) / zoom;
      const deltaY = (e.clientY - startPosRef.current.y) / zoom;

      if (isDragging) {
        const newPosition: ButtonPosition = {
          ...originalPosRef.current,
          x: Math.max(0, originalPosRef.current.x + deltaX),
          y: Math.max(0, originalPosRef.current.y + deltaY),
        };
        setDragPosition(newPosition);
      } else if (isResizing && resizeHandle) {
        let { x, y, width, height } = originalPosRef.current;

        switch (resizeHandle) {
          case 'se':
            width = Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, originalPosRef.current.width + deltaX);
            height = Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, originalPosRef.current.height + deltaY);
            break;
          case 'sw':
            x = originalPosRef.current.x + deltaX;
            width = Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, originalPosRef.current.width - deltaX);
            height = Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, originalPosRef.current.height + deltaY);
            if (width === SIZE_CONSTRAINTS.MIN_WIDTH) {
              x = originalPosRef.current.x + originalPosRef.current.width - SIZE_CONSTRAINTS.MIN_WIDTH;
            }
            break;
          case 'ne':
            y = originalPosRef.current.y + deltaY;
            width = Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, originalPosRef.current.width + deltaX);
            height = Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, originalPosRef.current.height - deltaY);
            if (height === SIZE_CONSTRAINTS.MIN_HEIGHT) {
              y = originalPosRef.current.y + originalPosRef.current.height - SIZE_CONSTRAINTS.MIN_HEIGHT;
            }
            break;
          case 'nw':
            x = originalPosRef.current.x + deltaX;
            y = originalPosRef.current.y + deltaY;
            width = Math.max(SIZE_CONSTRAINTS.MIN_WIDTH, originalPosRef.current.width - deltaX);
            height = Math.max(SIZE_CONSTRAINTS.MIN_HEIGHT, originalPosRef.current.height - deltaY);
            if (width === SIZE_CONSTRAINTS.MIN_WIDTH) {
              x = originalPosRef.current.x + originalPosRef.current.width - SIZE_CONSTRAINTS.MIN_WIDTH;
            }
            if (height === SIZE_CONSTRAINTS.MIN_HEIGHT) {
              y = originalPosRef.current.y + originalPosRef.current.height - SIZE_CONSTRAINTS.MIN_HEIGHT;
            }
            break;
        }

        // Clamp to max size
        width = Math.min(SIZE_CONSTRAINTS.MAX_WIDTH, width);
        height = Math.min(SIZE_CONSTRAINTS.MAX_HEIGHT, height);
        x = Math.max(0, x);
        y = Math.max(0, y);

        setDragPosition({
          ...originalPosRef.current,
          x,
          y,
          width,
          height,
        });
      }
    },
    [isDragging, isResizing, resizeHandle, zoom]
  );

  /**
   * Handle pointer up - end drag/resize and save
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging && !isResizing) return;

      e.preventDefault();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // Update z-index to bring to front
      const maxZIndex = localPosition.zIndex;
      const newPosition: ButtonPosition = {
        ...localPosition,
        zIndex: maxZIndex + 1,
      };

      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      setDragPosition(null);

      // Notify parent of position change
      onPositionChange(newPosition);
    },
    [isDragging, isResizing, localPosition, onPositionChange]
  );

  /**
   * Handle resize handle pointer down
   */
  const handleResizeStart = useCallback(
    (handle: ResizeHandle) => (e: React.PointerEvent) => {
      if (!isEditing) return;

      e.preventDefault();
      e.stopPropagation();

      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsResizing(true);
      setResizeHandle(handle);
      setDragPosition(localPosition);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      originalPosRef.current = localPosition;
    },
    [isEditing, localPosition]
  );

  /**
   * Handle click in view mode
   */
  const handleClick = useCallback(() => {
    if (!isEditing) {
      onTap();
    }
  }, [isEditing, onTap]);

  return (
    <div
      ref={containerRef}
      className={`draggable-button ${isDragging ? 'draggable-button--dragging' : ''} ${
        isResizing ? 'draggable-button--resizing' : ''
      } ${isSelected ? 'draggable-button--selected' : ''} ${
        isEditing ? 'draggable-button--editing' : ''
      }`}
      style={{
        position: 'absolute',
        left: localPosition.x * zoom,
        top: localPosition.y * zoom,
        width: localPosition.width * zoom,
        height: localPosition.height * zoom,
        zIndex: localPosition.zIndex,
        touchAction: isEditing ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <BoardButton
        button={button}
        onTap={handleClick}
        isEditMode={isEditing}
        isSelected={isSelected}
        onSelect={onSelect}
        tabIndex={tabIndex}
        isPlaying={isPlaying}
        progress={progress}
        labelPosition={labelPosition}
      />

      {/* Resize handles - only show when selected and editing */}
      {isSelected && isEditing && (
        <>
          <div
            className="resize-handle resize-handle--nw"
            onPointerDown={handleResizeStart('nw')}
          />
          <div
            className="resize-handle resize-handle--ne"
            onPointerDown={handleResizeStart('ne')}
          />
          <div
            className="resize-handle resize-handle--sw"
            onPointerDown={handleResizeStart('sw')}
          />
          <div
            className="resize-handle resize-handle--se"
            onPointerDown={handleResizeStart('se')}
          />
        </>
      )}
    </div>
  );
}
