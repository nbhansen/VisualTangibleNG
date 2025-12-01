/**
 * Time Utilities Unit Tests
 *
 * Tests for time formatting functions.
 */

import { describe, it, expect } from 'vitest';
import { formatDuration, formatRemainingTime } from '../../src/utils/time';

describe('Time Utilities', () => {
  describe('formatDuration', () => {
    it('should format 0 seconds', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should format seconds under a minute', () => {
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(59)).toBe('0:59');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(125)).toBe('2:05');
    });
  });

  describe('formatRemainingTime', () => {
    it('should show remaining time from max', () => {
      expect(formatRemainingTime(0, 30)).toBe('0:30');
      expect(formatRemainingTime(10, 30)).toBe('0:20');
      expect(formatRemainingTime(25, 30)).toBe('0:05');
    });

    it('should show 0:00 when elapsed equals max', () => {
      expect(formatRemainingTime(30, 30)).toBe('0:00');
    });
  });
});
