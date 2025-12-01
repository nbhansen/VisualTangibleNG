/**
 * Board Component
 *
 * Main communication board grid displaying buttons.
 * Supports keyboard navigation with arrow keys.
 * Conditionally renders grid or freeform canvas based on board mode.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import type { ButtonWithMedia, GridLayout, LabelPosition, BoardMode, Viewport } from '../../types';
import { GRID_ARRANGEMENTS, DEFAULT_VIEWPORT, DEFAULT_CANVAS_CONFIG } from '../../types';
import { BoardButton } from './BoardButton';
import { BoardCanvas } from './BoardCanvas';
import './Board.css';

interface BoardProps {
  buttons: ButtonWithMedia[];
  layout: GridLayout;
  onButtonTap: (button: ButtonWithMedia) => void;
  isEditMode?: boolean;
  selectedButtonId?: string | null;
  onButtonSelect?: (button: ButtonWithMedia) => void;
  // Audio feedback props (002-audio-feedback)
  playingButtonId?: string | null;
  progress?: number;
  // Label position for all buttons (003-button-text)
  labelPosition?: LabelPosition;
  // Freeform board props (004-freeform-board)
  mode?: BoardMode;
  boardId?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  viewportZoom?: number;
  viewportPanX?: number;
  viewportPanY?: number;
  onButtonsChange?: () => void;
}

export function Board({
  buttons,
  layout,
  onButtonTap,
  isEditMode = false,
  selectedButtonId = null,
  onButtonSelect,
  playingButtonId = null,
  progress = 0,
  labelPosition = 'below',
  mode = 'grid',
  boardId,
  canvasWidth = DEFAULT_CANVAS_CONFIG.width,
  canvasHeight = DEFAULT_CANVAS_CONFIG.height,
  viewportZoom = DEFAULT_VIEWPORT.zoom,
  viewportPanX = DEFAULT_VIEWPORT.panX,
  viewportPanY = DEFAULT_VIEWPORT.panY,
  onButtonsChange,
}: BoardProps) {
  // Grid mode state - hooks must be called unconditionally
  const [rows, cols] = GRID_ARRANGEMENTS[layout];
  const visibleButtons = buttons.slice(0, layout);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const total = visibleButtons.length;
      if (total === 0) return;

      let newIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          newIndex = (focusedIndex + 1) % total;
          break;
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = (focusedIndex - 1 + total) % total;
          break;
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (focusedIndex + cols) % total;
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (focusedIndex - cols + total) % total;
          break;
        case 'Enter':
        case ' ': {
          event.preventDefault();
          const focusedButton = visibleButtons[focusedIndex];
          if (focusedButton) {
            if (isEditMode) {
              onButtonSelect?.(focusedButton);
            } else {
              onButtonTap(focusedButton);
            }
          }
          return;
        }
        default:
          return;
      }

      setFocusedIndex(newIndex);
    },
    [focusedIndex, visibleButtons, cols, isEditMode, onButtonSelect, onButtonTap]
  );

  // Focus the button at focusedIndex when it changes
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const gridButtons = grid.querySelectorAll<HTMLButtonElement>('.board-button');
    if (gridButtons[focusedIndex]) {
      gridButtons[focusedIndex].focus();
    }
  }, [focusedIndex]);

  // Freeform mode - render BoardCanvas
  if (mode === 'freeform' && boardId) {
    const viewport: Viewport = {
      zoom: viewportZoom,
      panX: viewportPanX,
      panY: viewportPanY,
    };

    return (
      <BoardCanvas
        buttons={buttons}
        boardId={boardId}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        initialViewport={viewport}
        isEditing={isEditMode}
        onButtonTap={onButtonTap}
        onButtonSelect={onButtonSelect}
        selectedButtonId={selectedButtonId}
        labelPosition={labelPosition}
        playingButtonId={playingButtonId}
        progress={progress}
        onButtonsChange={onButtonsChange}
      />
    );
  }

  // Grid mode - render grid layout
  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Communication board"
      className="board"
      style={{
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
      onKeyDown={handleKeyDown}
    >
      {visibleButtons.map((button, index) => (
        <BoardButton
          key={button.id}
          button={button}
          onTap={() => onButtonTap(button)}
          isEditMode={isEditMode}
          isSelected={selectedButtonId === button.id}
          onSelect={() => onButtonSelect?.(button)}
          tabIndex={index === focusedIndex ? 0 : -1}
          isPlaying={playingButtonId === button.id}
          progress={playingButtonId === button.id ? progress : 0}
          labelPosition={labelPosition}
        />
      ))}
    </div>
  );
}
