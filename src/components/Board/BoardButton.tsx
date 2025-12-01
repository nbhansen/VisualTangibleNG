/**
 * BoardButton Component
 *
 * A single button on the communication board.
 * Displays image and triggers audio playback on tap.
 */

import { useState, useCallback } from 'react';
import type { ButtonWithMedia, LabelPosition } from '../../types';
import './BoardButton.css';

interface BoardButtonProps {
  button: ButtonWithMedia;
  onTap: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  tabIndex?: number;
  // Label props (003-button-text)
  label?: string | null;
  labelPosition?: LabelPosition;
}

export function BoardButton({
  button,
  onTap,
  isEditMode = false,
  isSelected = false,
  onSelect,
  tabIndex = 0,
  label,
  labelPosition = 'below',
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

  // Resolve label from prop or button.label (003-button-text)
  const displayLabel = label !== undefined ? label : (button.label ?? null);
  const showLabel = displayLabel && labelPosition !== 'hidden';

  // Build accessible name including label if present (003-button-text)
  const accessibleName = displayLabel
    ? `${displayLabel}${button.audioBuffer ? ' - tap to play' : ''}`
    : hasContent
      ? `Button ${button.position + 1}${button.audioBuffer ? ' - tap to play' : ''}`
      : `Empty button ${button.position + 1}`;

  return (
    <button
      type="button"
      className={`board-button ${isActive ? 'board-button--active' : ''} ${
        isSelected ? 'board-button--selected' : ''
      } ${!hasContent ? 'board-button--empty' : ''}`}
      data-label-position={labelPosition}
      onClick={handleClick}
      aria-label={accessibleName}
      role="gridcell"
      tabIndex={tabIndex}
    >
      <div className="board-button__content">
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

        {/* Label display (003-button-text) */}
        {showLabel && (
          <span className="board-button__label" dir="auto">
            {displayLabel}
          </span>
        )}
      </div>
    </button>
  );
}
