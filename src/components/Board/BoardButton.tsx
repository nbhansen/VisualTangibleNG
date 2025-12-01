/**
 * BoardButton Component
 *
 * A single button on the communication board.
 * Displays image and triggers audio playback on tap.
 */

import { useState, useCallback } from 'react';
import type { ButtonWithMedia } from '../../types';
import './BoardButton.css';

interface BoardButtonProps {
  button: ButtonWithMedia;
  onTap: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  tabIndex?: number;
}

export function BoardButton({
  button,
  onTap,
  isEditMode = false,
  isSelected = false,
  onSelect,
  tabIndex = 0,
}: BoardButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = useCallback(() => {
    if (isEditMode) {
      onSelect?.();
    } else {
      // Visual feedback
      setIsActive(true);
      setTimeout(() => setIsActive(false), 200);
      onTap();
    }
  }, [isEditMode, onSelect, onTap]);

  const hasContent = button.imageUrl || button.audioBuffer;

  return (
    <button
      type="button"
      className={`board-button ${isActive ? 'board-button--active' : ''} ${
        isSelected ? 'board-button--selected' : ''
      } ${!hasContent ? 'board-button--empty' : ''}`}
      onClick={handleClick}
      aria-label={
        hasContent
          ? `Button ${button.position + 1}${button.audioBuffer ? ' - tap to play' : ''}`
          : `Empty button ${button.position + 1}`
      }
      role="gridcell"
      tabIndex={tabIndex}
    >
      {button.imageUrl ? (
        <img
          src={button.imageUrl}
          alt=""
          className="board-button__image"
          draggable={false}
        />
      ) : (
        <span className="board-button__placeholder">
          {isEditMode ? '+' : ''}
        </span>
      )}
    </button>
  );
}
