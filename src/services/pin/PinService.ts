/**
 * PIN Service Implementation
 *
 * Handles PIN hashing and verification using SubtleCrypto.
 */

import type { IPinService } from '../../types/pin';
import { PinError, isValidPin } from '../../types/pin';
import { getStorageService } from '../storage';

export class PinService implements IPinService {
  async isPinSet(): Promise<boolean> {
    const storage = getStorageService();
    await storage.initialize();
    const state = await storage.getAppState();
    return state.pinHash !== null;
  }

  async isFirstRun(): Promise<boolean> {
    const storage = getStorageService();
    await storage.initialize();
    const state = await storage.getAppState();
    return state.isFirstRun;
  }

  async setPin(pin: string): Promise<void> {
    if (!isValidPin(pin)) {
      throw new PinError('PIN must be exactly 4 digits', 'INVALID_FORMAT');
    }

    const hash = await this.hashPin(pin);
    const storage = getStorageService();
    await storage.initialize();
    await storage.updateAppState({
      pinHash: hash,
      isFirstRun: false,
    });
  }

  async verifyPin(pin: string): Promise<boolean> {
    if (!isValidPin(pin)) {
      return false;
    }

    const storage = getStorageService();
    await storage.initialize();
    const state = await storage.getAppState();

    if (!state.pinHash) {
      throw new PinError('No PIN has been set', 'NOT_SET');
    }

    const inputHash = await this.hashPin(pin);
    return inputHash === state.pinHash;
  }

  async resetPin(): Promise<void> {
    const storage = getStorageService();
    await storage.initialize();
    await storage.updateAppState({
      pinHash: null,
      // Note: isFirstRun stays false - user has used the app before
    });
  }

  async hashPin(pin: string): Promise<string> {
    try {
      // Encode PIN as UTF-8
      const encoder = new TextEncoder();
      const data = encoder.encode(pin);

      // Hash with SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      throw new PinError(
        `Failed to hash PIN: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HASH_FAILED'
      );
    }
  }
}

// Singleton instance
let pinServiceInstance: PinService | null = null;

export function getPinService(): PinService {
  if (!pinServiceInstance) {
    pinServiceInstance = new PinService();
  }
  return pinServiceInstance;
}
