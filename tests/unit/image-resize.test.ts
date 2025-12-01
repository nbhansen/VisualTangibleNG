/**
 * Image Resize Unit Tests (T060)
 *
 * Tests for image resize calculations.
 */

import { describe, it, expect } from 'vitest';
import { MAX_IMAGE_DIMENSION_PX } from '../../src/types';

describe('Image Resize Logic', () => {
  const MAX_DIM = MAX_IMAGE_DIMENSION_PX; // 512

  function calculateResize(width: number, height: number): { width: number; height: number } {
    if (width <= MAX_DIM && height <= MAX_DIM) {
      return { width, height };
    }

    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
    };
  }

  it('should not resize images smaller than max dimension', () => {
    const result = calculateResize(400, 300);
    expect(result).toEqual({ width: 400, height: 300 });
  });

  it('should resize landscape image to fit max width', () => {
    const result = calculateResize(1024, 512);
    expect(result.width).toBe(MAX_DIM);
    expect(result.height).toBe(256);
  });

  it('should resize portrait image to fit max height', () => {
    const result = calculateResize(512, 1024);
    expect(result.width).toBe(256);
    expect(result.height).toBe(MAX_DIM);
  });

  it('should resize square image correctly', () => {
    const result = calculateResize(1000, 1000);
    expect(result.width).toBe(MAX_DIM);
    expect(result.height).toBe(MAX_DIM);
  });

  it('should maintain aspect ratio', () => {
    const original = { width: 1600, height: 900 };
    const result = calculateResize(original.width, original.height);

    const originalRatio = original.width / original.height;
    const resultRatio = result.width / result.height;

    expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.01);
  });
});
