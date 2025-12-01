/**
 * LabelPositionSelector Component
 *
 * Allows selecting where button labels appear: above, below, or hidden.
 * (003-button-text)
 */

import type { LabelPosition } from '../../types';
import './Editor.css';

interface LabelPositionSelectorProps {
  currentPosition: LabelPosition;
  onPositionChange: (position: LabelPosition) => void;
  disabled?: boolean;
}

const POSITION_OPTIONS: { value: LabelPosition; label: string }[] = [
  { value: 'below', label: 'Below' },
  { value: 'above', label: 'Above' },
  { value: 'hidden', label: 'Hidden' },
];

export function LabelPositionSelector({
  currentPosition,
  onPositionChange,
  disabled = false,
}: LabelPositionSelectorProps) {
  return (
    <div className="label-position-selector">
      <h3 className="label-position-selector__title">Label Position</h3>
      <div className="label-position-selector__options" role="radiogroup" aria-label="Label position">
        {POSITION_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`label-position-selector__option ${
              currentPosition === option.value ? 'label-position-selector__option--selected' : ''
            }`}
          >
            <input
              type="radio"
              name="labelPosition"
              value={option.value}
              checked={currentPosition === option.value}
              onChange={() => onPositionChange(option.value)}
              disabled={disabled}
              className="label-position-selector__input"
            />
            <span className="label-position-selector__label">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
