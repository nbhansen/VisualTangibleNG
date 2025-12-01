/**
 * LayoutSelector Component
 *
 * Select grid layout for the communication board.
 * Shows visual preview of each layout option.
 */

import { useCallback } from 'react';
import type { GridLayout } from '../../types';
import { GRID_ARRANGEMENTS } from '../../types';
import './Editor.css';

interface LayoutSelectorProps {
  currentLayout: GridLayout;
  onLayoutChange: (layout: GridLayout) => void;
  disabled?: boolean;
}

const LAYOUT_OPTIONS: GridLayout[] = [1, 2, 4, 9, 16];

export function LayoutSelector({
  currentLayout,
  onLayoutChange,
  disabled = false,
}: LayoutSelectorProps) {
  const handleSelect = useCallback(
    (layout: GridLayout) => {
      if (!disabled && layout !== currentLayout) {
        onLayoutChange(layout);
      }
    },
    [currentLayout, onLayoutChange, disabled]
  );

  return (
    <div className="layout-selector">
      <h3 className="layout-selector__title">Grid Layout</h3>
      <div className="layout-selector__options" role="radiogroup" aria-label="Select grid layout">
        {LAYOUT_OPTIONS.map((layout) => {
          const [rows, cols] = GRID_ARRANGEMENTS[layout];
          const isSelected = layout === currentLayout;

          return (
            <button
              key={layout}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`layout-selector__option ${isSelected ? 'layout-selector__option--selected' : ''}`}
              onClick={() => handleSelect(layout)}
              disabled={disabled}
              aria-label={`${layout} button${layout === 1 ? '' : 's'} (${rows}x${cols} grid)`}
            >
              <LayoutPreview rows={rows} cols={cols} />
              <span className="layout-selector__label">{layout}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface LayoutPreviewProps {
  rows: number;
  cols: number;
}

function LayoutPreview({ rows, cols }: LayoutPreviewProps) {
  const cells = Array.from({ length: rows * cols });

  return (
    <div
      className="layout-preview"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {cells.map((_, index) => (
        <div key={index} className="layout-preview__cell" />
      ))}
    </div>
  );
}
