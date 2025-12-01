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
  // Audio feedback props (002-audio-feedback)
  isPlaying?: boolean;
  progress?: number;
}

export function BoardButton({
  button,
  onTap,
  isEditMode = false,
  isSelected = false,
  onSelect,
  tabIndex = 0,
  isPlaying = false,
  progress = 0,
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

  // Calculate SVG progress ring values (002-audio-feedback)
  const ringSize = 100;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      type="button"
      className={`board-button ${isActive ? 'board-button--active' : ''} ${
        isSelected ? 'board-button--selected' : ''
      } ${!hasContent ? 'board-button--empty' : ''} ${
        isPlaying ? 'board-button--playing' : ''
      }`}
      onClick={handleClick}
      aria-label={
        hasContent
          ? `Button ${button.position + 1}${button.audioBuffer ? ' - tap to play' : ''}`
          : `Empty button ${button.position + 1}`
      }
      aria-pressed={isPlaying}
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

      {/* Progress ring - only shown when playing (002-audio-feedback) */}
      {isPlaying && (
        <svg
          className="board-button__progress-ring"
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            className="board-button__progress-ring-bg"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            className="board-button__progress-ring-fill"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      )}
    </button>
  );
}
