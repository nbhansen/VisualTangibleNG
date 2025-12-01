/**
 * PIN Service Interface
 *
 * Defines the contract for PIN management.
 * Handles hashing and verification of the edit mode PIN.
 */

// =============================================================================
// PIN Service Interface
// =============================================================================

export interface IPinService {
  /**
   * Check if a PIN has been set.
   */
  isPinSet(): Promise<boolean>;

  /**
   * Check if this is the first run (no PIN ever set).
   */
  isFirstRun(): Promise<boolean>;

  /**
   * Set or update the PIN.
   * Hashes the PIN before storing.
   */
  setPin(pin: string): Promise<void>;

  /**
   * Verify a PIN against the stored hash.
   * Returns true if correct, false otherwise.
   */
  verifyPin(pin: string): Promise<boolean>;

  /**
   * Reset the PIN (clears hash, sets first run false).
   * Used for "forgot PIN" flow.
   * Does NOT clear board data.
   */
  resetPin(): Promise<void>;

  /**
   * Hash a PIN using SHA-256.
   * Exposed for testing purposes.
   */
  hashPin(pin: string): Promise<string>;
}

// =============================================================================
// PIN Validation
// =============================================================================

/**
 * Validate PIN format.
 * PIN must be exactly 4 digits.
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * PIN requirements for display to user.
 */
export const PIN_REQUIREMENTS = {
  length: 4,
  allowedCharacters: 'digits only (0-9)',
  example: '1234',
} as const;

// =============================================================================
// PIN Errors
// =============================================================================

export class PinError extends Error {
  readonly code: PinErrorCode;

  constructor(message: string, code: PinErrorCode) {
    super(message);
    this.name = 'PinError';
    this.code = code;
  }
}

export type PinErrorCode =
  | 'INVALID_FORMAT' // PIN doesn't match required format
  | 'NOT_SET' // Attempted verify when no PIN set
  | 'HASH_FAILED'; // Failed to hash PIN (crypto error)
