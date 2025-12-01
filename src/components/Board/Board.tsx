/**
 * Board Component
 *
 * Main communication board grid displaying buttons.
 * Supports keyboard navigation with arrow keys.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import type { ButtonWithMedia, GridLayout, LabelPosition } from '../../types';
import { GRID_ARRANGEMENTS } from '../../types';
import { BoardButton } from './BoardButton';
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
}: BoardProps) {
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

    const buttons = grid.querySelectorAll<HTMLButtonElement>('.board-button');
    if (buttons[focusedIndex]) {
      buttons[focusedIndex].focus();
    }
  }, [focusedIndex]);

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
