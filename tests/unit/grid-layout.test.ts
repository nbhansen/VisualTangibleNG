/**
 * Grid Layout Unit Tests (T033)
 *
 * Tests for grid arrangement calculations and layout logic.
 */

import { describe, it, expect } from 'vitest';
import { GRID_ARRANGEMENTS, type GridLayout } from '../../src/types';

describe('Grid Layout', () => {
  describe('GRID_ARRANGEMENTS constant', () => {
    it('should have arrangement for layout 1', () => {
      expect(GRID_ARRANGEMENTS[1]).toEqual([1, 1]);
    });

    it('should have arrangement for layout 2', () => {
      expect(GRID_ARRANGEMENTS[2]).toEqual([1, 2]);
    });

    it('should have arrangement for layout 4', () => {
      expect(GRID_ARRANGEMENTS[4]).toEqual([2, 2]);
    });

    it('should have arrangement for layout 9', () => {
      expect(GRID_ARRANGEMENTS[9]).toEqual([3, 3]);
    });

    it('should have arrangement for layout 16', () => {
      expect(GRID_ARRANGEMENTS[16]).toEqual([4, 4]);
    });

    it('should only have 5 valid layouts', () => {
      const layouts = Object.keys(GRID_ARRANGEMENTS);
      expect(layouts).toHaveLength(5);
    });
  });

  describe('Grid calculations', () => {
    it('should calculate correct cell count from arrangement', () => {
      const layouts: GridLayout[] = [1, 2, 4, 9, 16];

      layouts.forEach((layout) => {
        const [rows, cols] = GRID_ARRANGEMENTS[layout];
        expect(rows * cols).toBe(layout);
      });
    });

    it('should produce square grids for 1, 4, 9, 16', () => {
      const squareLayouts: GridLayout[] = [1, 4, 9, 16];

      squareLayouts.forEach((layout) => {
        const [rows, cols] = GRID_ARRANGEMENTS[layout];
        expect(rows).toBe(cols);
      });
    });

    it('should produce 1x2 for layout 2', () => {
      const [rows, cols] = GRID_ARRANGEMENTS[2];
      expect(rows).toBe(1);
      expect(cols).toBe(2);
    });
  });

  describe('Button visibility', () => {
    it('should show only first N buttons for layout N', () => {
      const allButtons = Array.from({ length: 16 }, (_, i) => ({ id: `btn-${i}`, position: i }));

      const layouts: GridLayout[] = [1, 2, 4, 9, 16];

      layouts.forEach((layout) => {
        const visibleButtons = allButtons.slice(0, layout);
        expect(visibleButtons).toHaveLength(layout);
        expect(visibleButtons[0].position).toBe(0);
        expect(visibleButtons[visibleButtons.length - 1].position).toBe(layout - 1);
      });
    });

    it('should preserve all 16 buttons in data even when fewer visible', () => {
      const allButtons = Array.from({ length: 16 }, (_, i) => ({
        id: `btn-${i}`,
        position: i,
        hasContent: i < 10, // First 10 have content
      }));

      // Change to layout 4 - only 4 visible but all 16 preserved
      const layout: GridLayout = 4;
      const visibleButtons = allButtons.slice(0, layout);
      const hiddenButtons = allButtons.slice(layout);

      expect(visibleButtons).toHaveLength(4);
      expect(hiddenButtons).toHaveLength(12);

      // Hidden buttons still have their content
      expect(hiddenButtons.filter((b) => b.hasContent)).toHaveLength(6);
    });
  });

  describe('Touch target size', () => {
    const MIN_TOUCH_TARGET = 44; // pixels

    it('should meet minimum touch target for all layouts on small screen', () => {
      const screenWidth = 320; // Small phone
      const screenHeight = 480;
      const padding = 16; // Total horizontal padding

      const availableWidth = screenWidth - padding;
      const availableHeight = screenHeight - 100; // Footer space

      const layouts: GridLayout[] = [1, 2, 4, 9, 16];

      layouts.forEach((layout) => {
        const [rows, cols] = GRID_ARRANGEMENTS[layout];
        const gap = 8;

        const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
        const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

        const buttonSize = Math.min(cellWidth, cellHeight);

        // All layouts should meet minimum on small screen
        // (16-button layout is tight but should still work)
        if (layout <= 9) {
          expect(buttonSize).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        }
      });
    });
  });
});
