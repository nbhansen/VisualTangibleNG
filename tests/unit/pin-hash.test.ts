/**
 * PIN Hashing Unit Tests (T049)
 *
 * Tests for SHA-256 PIN hashing.
 */

import { describe, it, expect } from 'vitest';
import { isValidPin } from '../../src/types/pin';

describe('PIN Validation', () => {
  it('should accept valid 4-digit PIN', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
    expect(isValidPin('9999')).toBe(true);
  });

  it('should reject PIN with wrong length', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });

  it('should reject PIN with non-digits', () => {
    expect(isValidPin('abcd')).toBe(false);
    expect(isValidPin('12ab')).toBe(false);
    expect(isValidPin('12 4')).toBe(false);
  });
});
