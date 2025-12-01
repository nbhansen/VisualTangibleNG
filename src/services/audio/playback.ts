/**
 * Audio Playback Service
 *
 * Low-latency audio playback using Web Audio API.
 * Extended with progress tracking for visual feedback (002-audio-feedback).
 */

import type { IAudioPlaybackService, AudioPlaybackHandle, PlaybackProgress } from '../../types/audio';
import { AudioError } from '../../types/audio';

class AudioPlaybackService implements IAudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private currentSources: Set<AudioBufferSourceNode> = new Set();

  // Playback feedback state (002-audio-feedback)
  private currentButtonId: string | null = null;
  private playbackStartTime: number = 0;
  private playbackDuration: number = 0;

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume context if suspended (required after user interaction)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  isReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  async decodeAudio(blob: Blob): Promise<AudioBuffer> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      return await this.audioContext!.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new AudioError(
        `Failed to decode audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DECODE_FAILED'
      );
    }
  }

  play(buffer: AudioBuffer, buttonId?: string): AudioPlaybackHandle {
    if (!this.audioContext) {
      throw new AudioError('Audio context not initialized', 'PLAYBACK_FAILED');
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    this.currentSources.add(source);

    // Track playback state for feedback (002-audio-feedback)
    this.currentButtonId = buttonId ?? null;
    this.playbackStartTime = this.audioContext.currentTime;
    this.playbackDuration = buffer.duration;

    let resolveOnEnded: () => void;
    const onEnded = new Promise<void>((resolve) => {
      resolveOnEnded = resolve;
    });

    source.onended = () => {
      this.currentSources.delete(source);
      // Clear playback state
      if (this.currentButtonId === buttonId) {
        this.currentButtonId = null;
        this.playbackStartTime = 0;
        this.playbackDuration = 0;
      }
      resolveOnEnded();
    };

    source.start(0);

    return {
      stop: () => {
        try {
          source.stop();
          this.currentSources.delete(source);
          // Clear playback state
          if (this.currentButtonId === buttonId) {
            this.currentButtonId = null;
            this.playbackStartTime = 0;
            this.playbackDuration = 0;
          }
        } catch {
          // Already stopped
        }
      },
      onEnded,
    };
  }

  /**
   * Get current playback progress.
   * Returns null if nothing is playing.
   */
  getPlaybackProgress(): PlaybackProgress | null {
    if (!this.currentButtonId || !this.audioContext || this.playbackDuration === 0) {
      return null;
    }

    const elapsed = this.audioContext.currentTime - this.playbackStartTime;
    const progress = Math.min(1, Math.max(0, elapsed / this.playbackDuration));

    return {
      buttonId: this.currentButtonId,
      elapsed,
      duration: this.playbackDuration,
      progress,
    };
  }

  /**
   * Get the currently playing button ID.
   */
  getCurrentButtonId(): string | null {
    return this.currentButtonId;
  }

  stopAll(): void {
    for (const source of this.currentSources) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    }
    this.currentSources.clear();
    // Clear playback state (002-audio-feedback)
    this.currentButtonId = null;
    this.playbackStartTime = 0;
    this.playbackDuration = 0;
  }

  dispose(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let audioPlaybackService: AudioPlaybackService | null = null;

export function getAudioPlaybackService(): AudioPlaybackService {
  if (!audioPlaybackService) {
    audioPlaybackService = new AudioPlaybackService();
  }
  return audioPlaybackService;
}

export { AudioPlaybackService };
