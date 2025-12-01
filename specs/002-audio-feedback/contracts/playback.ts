/**
 * Audio Playback Feedback Contracts
 *
 * Extends the audio playback interfaces to support visual feedback.
 * These interfaces define the runtime state for playback visualization.
 */

/**
 * Current playback progress information.
 * Used to drive visual feedback (pulse animation, progress ring).
 */
export interface PlaybackProgress {
  /** ID of the button whose audio is playing */
  buttonId: string;

  /** Elapsed playback time in seconds */
  elapsed: number;

  /** Total audio duration in seconds */
  duration: number;

  /** Progress as a value from 0 to 1 */
  progress: number;
}

/**
 * Complete playback state for the audio service.
 */
export interface PlaybackState {
  /** Whether audio is currently playing */
  isPlaying: boolean;

  /** ID of the currently playing button, or null if nothing playing */
  currentButtonId: string | null;

  /** Progress information, or null if not playing */
  progress: PlaybackProgress | null;
}

/**
 * Callback for progress updates during playback.
 * Called periodically (approximately 10Hz) while audio plays.
 */
export type PlaybackProgressCallback = (progress: PlaybackProgress) => void;

/**
 * Extended audio playback service interface with progress tracking.
 */
export interface IAudioPlaybackServiceWithFeedback {
  /**
   * Play audio with progress tracking.
   * @param audioBlob The audio data to play
   * @param buttonId The ID of the button being played
   * @param onProgress Optional callback for progress updates
   * @returns Promise that resolves when playback completes
   */
  play(
    audioBlob: Blob,
    buttonId: string,
    onProgress?: PlaybackProgressCallback
  ): Promise<void>;

  /**
   * Stop current playback.
   */
  stop(): void;

  /**
   * Stop all audio (alias for stop, for API compatibility).
   */
  stopAll(): void;

  /**
   * Get current playback state.
   */
  getState(): PlaybackState;
}

/**
 * Return type for the enhanced useAudio hook.
 */
export interface UseAudioWithFeedbackReturn {
  /** Play audio for a button */
  play: (audioBlob: Blob, buttonId: string) => Promise<void>;

  /** Stop current playback */
  stop: () => void;

  /** Whether audio is currently playing */
  isPlaying: boolean;

  /** ID of the currently playing button, or null */
  playingButtonId: string | null;

  /** Current progress (0-1), or 0 if not playing */
  progress: number;

  /** Elapsed time in seconds, or 0 if not playing */
  elapsed: number;

  /** Total duration in seconds, or 0 if not playing */
  duration: number;
}

/**
 * Props for BoardButton component with playback state.
 */
export interface BoardButtonPlaybackProps {
  /** Whether this button's audio is currently playing */
  isPlaying: boolean;

  /** Playback progress (0-1) for progress indicator */
  progress: number;
}
