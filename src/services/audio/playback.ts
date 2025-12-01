/**
 * Audio Playback Service
 *
 * Low-latency audio playback using Web Audio API.
 */

import type { IAudioPlaybackService, AudioPlaybackHandle } from '../../types/audio';
import { AudioError } from '../../types/audio';

class AudioPlaybackService implements IAudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private currentSources: Set<AudioBufferSourceNode> = new Set();

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

  play(buffer: AudioBuffer): AudioPlaybackHandle {
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

    let resolveOnEnded: () => void;
    const onEnded = new Promise<void>((resolve) => {
      resolveOnEnded = resolve;
    });

    source.onended = () => {
      this.currentSources.delete(source);
      resolveOnEnded();
    };

    source.start(0);

    return {
      stop: () => {
        try {
          source.stop();
          this.currentSources.delete(source);
        } catch {
          // Already stopped
        }
      },
      onEnded,
    };
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
