/**
 * Storage Service Interface
 *
 * Defines the contract for IndexedDB operations.
 * All methods return Promises for async IndexedDB access.
 */

import type {
  AppState,
  Board,
  Button,
  Image,
  Audio,
  GridLayout,
  BoardWithButtons,
} from './types';

// =============================================================================
// Storage Service Interface
// =============================================================================

export interface IStorageService {
  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initialize the database, creating stores if needed.
   * Must be called before any other operations.
   */
  initialize(): Promise<void>;

  /**
   * Close the database connection.
   */
  close(): Promise<void>;

  // ---------------------------------------------------------------------------
  // App State
  // ---------------------------------------------------------------------------

  /**
   * Get the application state (PIN, first run flag).
   * Creates default state if not exists.
   */
  getAppState(): Promise<AppState>;

  /**
   * Update application state fields.
   */
  updateAppState(updates: Partial<Omit<AppState, 'id'>>): Promise<AppState>;

  // ---------------------------------------------------------------------------
  // Board Operations
  // ---------------------------------------------------------------------------

  /**
   * Get the current board (singleton).
   * Creates default board with 16 empty buttons if not exists.
   */
  getBoard(): Promise<Board>;

  /**
   * Get the board with all buttons and their media loaded.
   */
  getBoardWithButtons(): Promise<BoardWithButtons>;

  /**
   * Update board layout.
   * Preserves all button data (hidden buttons retain content).
   */
  updateBoardLayout(layout: GridLayout): Promise<Board>;

  // ---------------------------------------------------------------------------
  // Button Operations
  // ---------------------------------------------------------------------------

  /**
   * Get a button by ID.
   */
  getButton(id: string): Promise<Button | null>;

  /**
   * Get all buttons for a board, sorted by position.
   */
  getButtonsByBoard(boardId: string): Promise<Button[]>;

  /**
   * Update a button's image reference.
   * Pass null to remove the image.
   */
  updateButtonImage(buttonId: string, imageId: string | null): Promise<Button>;

  /**
   * Update a button's audio reference.
   * Pass null to remove the audio.
   */
  updateButtonAudio(buttonId: string, audioId: string | null): Promise<Button>;

  // ---------------------------------------------------------------------------
  // Image Operations
  // ---------------------------------------------------------------------------

  /**
   * Get an image by ID.
   */
  getImage(id: string): Promise<Image | null>;

  /**
   * Get image for a button.
   */
  getImageByButton(buttonId: string): Promise<Image | null>;

  /**
   * Save a new image for a button.
   * Automatically updates button.imageId.
   * Deletes previous image if exists.
   */
  saveImage(
    buttonId: string,
    blob: Blob,
    mimeType: Image['mimeType'],
    width: number,
    height: number
  ): Promise<Image>;

  /**
   * Delete an image by ID.
   * Automatically clears button.imageId.
   */
  deleteImage(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Audio Operations
  // ---------------------------------------------------------------------------

  /**
   * Get an audio recording by ID.
   */
  getAudio(id: string): Promise<Audio | null>;

  /**
   * Get audio for a button.
   */
  getAudioByButton(buttonId: string): Promise<Audio | null>;

  /**
   * Save a new audio recording for a button.
   * Automatically updates button.audioId.
   * Deletes previous audio if exists.
   */
  saveAudio(
    buttonId: string,
    blob: Blob,
    mimeType: Audio['mimeType'],
    duration: number
  ): Promise<Audio>;

  /**
   * Delete an audio recording by ID.
   * Automatically clears button.audioId.
   */
  deleteAudio(id: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------------------------

  /**
   * Clear all button content (images and audio) for a board.
   * Preserves button records and positions.
   */
  clearBoardContent(boardId: string): Promise<void>;

  /**
   * Clear all data and reset to initial state.
   * Used for PIN reset or factory reset.
   */
  resetAllData(): Promise<void>;
}

// =============================================================================
// Storage Events
// =============================================================================

/**
 * Events emitted by the storage service for UI updates.
 */
export type StorageEvent =
  | { type: 'board-updated'; board: Board }
  | { type: 'button-updated'; button: Button }
  | { type: 'image-saved'; image: Image }
  | { type: 'image-deleted'; imageId: string }
  | { type: 'audio-saved'; audio: Audio }
  | { type: 'audio-deleted'; audioId: string }
  | { type: 'data-reset' };

export interface IStorageEventEmitter {
  on(callback: (event: StorageEvent) => void): () => void;
  emit(event: StorageEvent): void;
}
