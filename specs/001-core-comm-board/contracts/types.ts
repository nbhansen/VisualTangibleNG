/**
 * Core Communication Board - Type Definitions
 *
 * These types define the data structures used throughout the application.
 * They serve as contracts between components and the storage layer.
 */

// =============================================================================
// Enums and Constants
// =============================================================================

/**
 * Valid grid layouts for the communication board.
 * Each value represents the total number of visible buttons.
 */
export type GridLayout = 1 | 2 | 4 | 9 | 16;

/**
 * Grid arrangement mapping: layout -> [rows, columns]
 */
export const GRID_ARRANGEMENTS: Record<GridLayout, [number, number]> = {
  1: [1, 1],
  2: [1, 2],
  4: [2, 2],
  9: [3, 3],
  16: [4, 4],
};

/**
 * Maximum allowed values
 */
export const MAX_AUDIO_DURATION_SECONDS = 30;
export const MAX_IMAGE_DIMENSION_PX = 512;
export const MAX_BUTTON_POSITIONS = 16;

// =============================================================================
// Entity Types
// =============================================================================

/**
 * Application-level state (singleton)
 */
export interface AppState {
  /** Always "app-state" */
  id: 'app-state';
  /** SHA-256 hash of PIN (hex string), null if not set */
  pinHash: string | null;
  /** True until first PIN is created */
  isFirstRun: boolean;
  /** Data schema version (semver) */
  version: string;
}

/**
 * A communication board containing buttons
 */
export interface Board {
  /** UUID v4 */
  id: string;
  /** Number of buttons to display */
  layout: GridLayout;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/**
 * A single button on the board
 */
export interface Button {
  /** UUID v4 */
  id: string;
  /** Foreign key to Board */
  boardId: string;
  /** 0-indexed position (0-15) */
  position: number;
  /** Foreign key to Image, null if none */
  imageId: string | null;
  /** Foreign key to Audio, null if none */
  audioId: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/**
 * An image associated with a button
 */
export interface Image {
  /** UUID v4 */
  id: string;
  /** Foreign key to Button */
  buttonId: string;
  /** Image binary data */
  blob: Blob;
  /** MIME type */
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png';
  /** Width in pixels (max 512) */
  width: number;
  /** Height in pixels (max 512) */
  height: number;
  /** ISO 8601 timestamp */
  createdAt: string;
}

/**
 * An audio recording associated with a button
 */
export interface Audio {
  /** UUID v4 */
  id: string;
  /** Foreign key to Button */
  buttonId: string;
  /** Audio binary data */
  blob: Blob;
  /** MIME type */
  mimeType: 'audio/webm' | 'audio/mp4' | 'audio/ogg';
  /** Duration in seconds (max 30) */
  duration: number;
  /** ISO 8601 timestamp */
  createdAt: string;
}

// =============================================================================
// Derived/View Types
// =============================================================================

/**
 * Button with loaded image and audio data for display
 */
export interface ButtonWithMedia extends Button {
  /** Loaded image data, null if none */
  image: Image | null;
  /** Loaded audio data, null if none */
  audio: Audio | null;
  /** Object URL for image display (created from blob) */
  imageUrl: string | null;
  /** Decoded AudioBuffer for playback */
  audioBuffer: AudioBuffer | null;
}

/**
 * Board with all buttons loaded for display
 */
export interface BoardWithButtons extends Board {
  /** All buttons (0-15), sorted by position */
  buttons: ButtonWithMedia[];
}

// =============================================================================
// App State Types
// =============================================================================

/**
 * Current mode of the application
 */
export type AppMode = 'view' | 'edit' | 'pin-entry' | 'pin-setup';

/**
 * Recording state for audio capture
 */
export type RecordingState = 'idle' | 'recording' | 'previewing';

/**
 * Global application context
 */
export interface AppContext {
  /** Current display mode */
  mode: AppMode;
  /** The active board with loaded buttons */
  board: BoardWithButtons | null;
  /** Whether app state is loading */
  isLoading: boolean;
  /** Current error message, null if none */
  error: string | null;
  /** Currently selected button for editing (edit mode only) */
  selectedButtonId: string | null;
  /** Audio recording state (edit mode only) */
  recordingState: RecordingState;
  /** Elapsed recording time in seconds */
  recordingTime: number;
}

// =============================================================================
// Action Types (for useReducer)
// =============================================================================

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BOARD'; payload: BoardWithButtons }
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SELECT_BUTTON'; payload: string | null }
  | { type: 'UPDATE_BUTTON'; payload: ButtonWithMedia }
  | { type: 'SET_LAYOUT'; payload: GridLayout }
  | { type: 'SET_RECORDING_STATE'; payload: RecordingState }
  | { type: 'SET_RECORDING_TIME'; payload: number }
  | { type: 'RESET_RECORDING' };
