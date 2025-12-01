/**
 * Audio Service Interface
 *
 * Defines the contract for audio recording and playback.
 * Uses Web Audio API for low-latency playback and MediaRecorder for capture.
 */

// =============================================================================
// Audio Playback Interface
// =============================================================================

export interface IAudioPlaybackService {
  /**
   * Initialize the Web Audio context.
   * Must be called after user interaction (browser autoplay policy).
   */
  initialize(): Promise<void>;

  /**
   * Check if the audio context is initialized and ready.
   */
  isReady(): boolean;

  /**
   * Decode an audio blob into an AudioBuffer for playback.
   * Decoded buffers should be cached for instant playback.
   */
  decodeAudio(blob: Blob): Promise<AudioBuffer>;

  /**
   * Play an AudioBuffer immediately.
   * Returns a handle to stop playback.
   */
  play(buffer: AudioBuffer): AudioPlaybackHandle;

  /**
   * Stop any currently playing audio.
   */
  stopAll(): void;

  /**
   * Clean up resources.
   */
  dispose(): void;
}

export interface AudioPlaybackHandle {
  /** Stop this specific playback */
  stop(): void;
  /** Promise that resolves when playback completes naturally */
  onEnded: Promise<void>;
}

// =============================================================================
// Audio Recording Interface
// =============================================================================

export interface IAudioRecordingService {
  /**
   * Check if recording is supported by the browser.
   */
  isSupported(): boolean;

  /**
   * Check if a microphone is available.
   */
  hasMicrophone(): Promise<boolean>;

  /**
   * Request microphone permission.
   * Returns true if granted, false if denied.
   */
  requestPermission(): Promise<boolean>;

  /**
   * Start recording audio.
   * Will automatically stop after maxDurationSeconds.
   */
  startRecording(options?: RecordingOptions): Promise<RecordingSession>;

  /**
   * Get the current recording session, if any.
   */
  getCurrentSession(): RecordingSession | null;
}

export interface RecordingOptions {
  /** Maximum recording duration in seconds (default: 30) */
  maxDurationSeconds?: number;
  /** Callback for elapsed time updates */
  onTimeUpdate?: (elapsedSeconds: number) => void;
  /** Callback when recording auto-stops at max duration */
  onMaxDurationReached?: () => void;
}

export interface RecordingSession {
  /** Current state of the recording */
  state: 'recording' | 'stopped';

  /** Elapsed recording time in seconds */
  elapsedTime: number;

  /** Stop recording and get the result */
  stop(): Promise<RecordingResult>;

  /** Cancel recording without saving */
  cancel(): void;
}

export interface RecordingResult {
  /** The recorded audio as a Blob */
  blob: Blob;
  /** MIME type of the recording */
  mimeType: 'audio/webm' | 'audio/mp4' | 'audio/ogg';
  /** Duration in seconds */
  duration: number;
}

// =============================================================================
// Audio Errors
// =============================================================================

export class AudioError extends Error {
  readonly code: AudioErrorCode;

  constructor(message: string, code: AudioErrorCode) {
    super(message);
    this.name = 'AudioError';
    this.code = code;
  }
}

export type AudioErrorCode =
  | 'NOT_SUPPORTED' // Browser doesn't support required APIs
  | 'NO_MICROPHONE' // No microphone detected
  | 'PERMISSION_DENIED' // User denied microphone access
  | 'ALREADY_RECORDING' // Attempted to start while already recording
  | 'NOT_RECORDING' // Attempted to stop when not recording
  | 'DECODE_FAILED' // Failed to decode audio blob
  | 'PLAYBACK_FAILED'; // Failed to play audio

// =============================================================================
// Audio Playback Feedback (002-audio-feedback)
// =============================================================================

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
 * Return type for the enhanced useAudio hook with feedback support.
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
