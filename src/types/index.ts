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
// Freeform Board Types (004-freeform-board)
// =============================================================================

/**
 * Board layout mode (004-freeform-board)
 */
export type BoardMode = 'grid' | 'freeform';

/**
 * Viewport state for canvas navigation (004-freeform-board)
 */
export interface Viewport {
  /** Zoom level (0.5 to 2.0) */
  zoom: number;
  /** X translation in screen coordinates */
  panX: number;
  /** Y translation in screen coordinates */
  panY: number;
}

/**
 * Canvas configuration (004-freeform-board)
 */
export interface CanvasConfig {
  /** Virtual canvas width in world coordinates */
  width: number;
  /** Virtual canvas height in world coordinates */
  height: number;
}

/**
 * Default viewport state (004-freeform-board)
 */
export const DEFAULT_VIEWPORT: Viewport = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

/**
 * Default canvas configuration (004-freeform-board)
 */
export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 1920,
  height: 1080,
};

/**
 * Zoom constraints (004-freeform-board)
 */
export const ZOOM_CONSTRAINTS = {
  MIN: 0.5,
  MAX: 2.0,
  STEP: 0.1,
} as const;

/**
 * Point in 2D space (004-freeform-board)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle bounds (004-freeform-board)
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Button position and size for freeform mode (004-freeform-board)
 */
export interface ButtonPosition {
  /** X position in world coordinates */
  x: number;
  /** Y position in world coordinates */
  y: number;
  /** Width in world units */
  width: number;
  /** Height in world units */
  height: number;
  /** Stacking order (higher = front) */
  zIndex: number;
}

/**
 * Size constraints for buttons (004-freeform-board)
 */
export const SIZE_CONSTRAINTS = {
  MIN_WIDTH: 44,
  MIN_HEIGHT: 44,
  MAX_WIDTH: 500,
  MAX_HEIGHT: 500,
  DEFAULT_WIDTH: 120,
  DEFAULT_HEIGHT: 120,
} as const;

/**
 * Maximum buttons per board - performance limit (004-freeform-board)
 */
export const MAX_BUTTONS = 50;

/**
 * Maximum length for button labels (003-button-text)
 */
export const MAX_LABEL_LENGTH = 50;

/**
 * Position for text labels relative to button image (003-button-text)
 */
export type LabelPosition = 'above' | 'below' | 'hidden';

/**
 * Validates a label string (003-button-text)
 * @param label The label to validate
 * @returns true if valid (null, or string 1-50 chars after trim)
 */
export function isValidLabel(label: string | null): boolean {
  if (label === null) return true;
  const trimmed = label.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_LABEL_LENGTH;
}

/**
 * Normalizes a label for storage (trims whitespace) (003-button-text)
 * @param label The label to normalize
 * @returns Trimmed label, or null if empty/whitespace-only
 */
export function normalizeLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) return null;
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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
  /** Position for text labels (003-button-text) */
  labelPosition: LabelPosition;
  /** Board mode - grid or freeform (004-freeform-board) */
  mode: BoardMode;
  /** Virtual canvas width (004-freeform-board) */
  canvasWidth: number;
  /** Virtual canvas height (004-freeform-board) */
  canvasHeight: number;
  /** Current viewport zoom level (004-freeform-board) */
  viewportZoom: number;
  /** Current viewport pan X offset (004-freeform-board) */
  viewportPanX: number;
  /** Current viewport pan Y offset (004-freeform-board) */
  viewportPanY: number;
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
  /** 0-indexed position (0-15) for grid mode */
  position: number;
  /** Foreign key to Image, null if none */
  imageId: string | null;
  /** Foreign key to Audio, null if none */
  audioId: string | null;
  /** Text label for the button (003-button-text) */
  label: string | null;
  /** X position in world coords (004-freeform-board), null in grid mode */
  x: number | null;
  /** Y position in world coords (004-freeform-board), null in grid mode */
  y: number | null;
  /** Width in world units (004-freeform-board), null in grid mode */
  width: number | null;
  /** Height in world units (004-freeform-board), null in grid mode */
  height: number | null;
  /** Stacking order (004-freeform-board), null in grid mode */
  zIndex: number | null;
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
