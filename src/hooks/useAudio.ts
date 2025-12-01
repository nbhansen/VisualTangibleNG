/**
 * useAudio Hook
 *
 * React hook for audio playback control.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioPlaybackService, AudioPlaybackService } from '../services/audio';
import type { AudioPlaybackHandle } from '../types/audio';

interface UseAudioReturn {
  isReady: boolean;
  isPlaying: boolean;
  initialize: () => Promise<void>;
  playBuffer: (buffer: AudioBuffer) => void;
  playBlob: (blob: Blob) => Promise<void>;
  stop: () => void;
  decodeAudio: (blob: Blob) => Promise<AudioBuffer>;
}

export function useAudio(): UseAudioReturn {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const serviceRef = useRef<AudioPlaybackService | null>(null);
  const currentHandleRef = useRef<AudioPlaybackHandle | null>(null);

  useEffect(() => {
    serviceRef.current = getAudioPlaybackService();

    return () => {
      // Don't dispose - singleton is shared
    };
  }, []);

  const initialize = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.initialize();
      setIsReady(serviceRef.current.isReady());
    }
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer) => {
    if (!serviceRef.current) return;

    // Stop any current playback
    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
    }

    setIsPlaying(true);
    const handle = serviceRef.current.play(buffer);
    currentHandleRef.current = handle;

    handle.onEnded.then(() => {
      if (currentHandleRef.current === handle) {
        setIsPlaying(false);
        currentHandleRef.current = null;
      }
    });
  }, []);

  const playBlob = useCallback(
    async (blob: Blob) => {
      if (!serviceRef.current) return;

      // Ensure initialized
      if (!serviceRef.current.isReady()) {
        await initialize();
      }

      const buffer = await serviceRef.current.decodeAudio(blob);
      playBuffer(buffer);
    },
    [initialize, playBuffer]
  );

  const stop = useCallback(() => {
    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
      currentHandleRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const decodeAudio = useCallback(async (blob: Blob): Promise<AudioBuffer> => {
    if (!serviceRef.current) {
      throw new Error('Audio service not initialized');
    }

    // Ensure initialized
    if (!serviceRef.current.isReady()) {
      await serviceRef.current.initialize();
      setIsReady(true);
    }

    return serviceRef.current.decodeAudio(blob);
  }, []);

  return {
    isReady,
    isPlaying,
    initialize,
    playBuffer,
    playBlob,
    stop,
    decodeAudio,
  };
}
