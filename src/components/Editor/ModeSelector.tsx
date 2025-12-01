/**
 * ModeSelector Component (004-freeform-board)
 *
 * Radio button selector for switching between grid and freeform board modes.
 */

import type { BoardMode } from '../../types';

interface ModeSelectorProps {
  currentMode: BoardMode;
  onModeChange: (mode: BoardMode) => void;
  disabled?: boolean;
}

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  return (
    <section className="mode-selector">
      <h3 className="mode-selector__title">Board Mode</h3>

      <div className="mode-selector__options">
        <label
          className={`mode-selector__option ${
            currentMode === 'grid' ? 'mode-selector__option--selected' : ''
          }`}
        >
          <input
            type="radio"
            name="board-mode"
            value="grid"
            checked={currentMode === 'grid'}
            onChange={() => onModeChange('grid')}
            disabled={disabled}
            className="mode-selector__radio"
          />
          <div className="mode-selector__content">
            <div className="mode-selector__icon mode-selector__icon--grid">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="mode-selector__label">Grid</span>
            <span className="mode-selector__description">
              Fixed layout with equal-sized buttons
            </span>
          </div>
        </label>

        <label
          className={`mode-selector__option ${
            currentMode === 'freeform' ? 'mode-selector__option--selected' : ''
          }`}
        >
          <input
            type="radio"
            name="board-mode"
            value="freeform"
            checked={currentMode === 'freeform'}
            onChange={() => onModeChange('freeform')}
            disabled={disabled}
            className="mode-selector__radio"
          />
          <div className="mode-selector__content">
            <div className="mode-selector__icon mode-selector__icon--freeform">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="6" height="8" rx="1" />
                <rect x="10" y="4" width="5" height="5" rx="1" />
                <rect x="17" y="2" width="5" height="7" rx="1" />
                <rect x="3" y="12" width="8" height="6" rx="1" />
                <rect x="13" y="11" width="9" height="8" rx="1" />
              </svg>
            </div>
            <span className="mode-selector__label">Freeform</span>
            <span className="mode-selector__description">
              Drag buttons anywhere, resize freely
            </span>
          </div>
        </label>
      </div>
    </section>
  );
}
