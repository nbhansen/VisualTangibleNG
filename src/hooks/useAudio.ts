/**
 * useAudio Hook
 *
 * React hook for audio playback control.
 * Extended with playback feedback state (002-audio-feedback).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioPlaybackService, AudioPlaybackService } from '../services/audio';
import type { AudioPlaybackHandle, UseAudioWithFeedbackReturn } from '../types/audio';

interface UseAudioReturn extends UseAudioWithFeedbackReturn {
  isReady: boolean;
  initialize: () => Promise<void>;
  playBuffer: (buffer: AudioBuffer, buttonId?: string) => void;
  playBlob: (blob: Blob, buttonId?: string) => Promise<void>;
  decodeAudio: (blob: Blob) => Promise<AudioBuffer>;
  stopAll: () => void;
}

export function useAudio(): UseAudioReturn {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Playback feedback state (002-audio-feedback)
  const [playingButtonId, setPlayingButtonId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const serviceRef = useRef<AudioPlaybackService | null>(null);
  const currentHandleRef = useRef<AudioPlaybackHandle | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    serviceRef.current = getAudioPlaybackService();

    return () => {
      // Clean up progress tracking on unmount (002-audio-feedback T031)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Don't dispose service - singleton is shared
    };
  }, []);

  const initialize = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.initialize();
      setIsReady(serviceRef.current.isReady());
    }
  }, []);

  // Progress tracking via requestAnimationFrame (002-audio-feedback)
  const startProgressTracking = useCallback(() => {
    const updateProgress = () => {
      if (!serviceRef.current) return;

      const progressInfo = serviceRef.current.getPlaybackProgress();
      if (progressInfo) {
        setProgress(progressInfo.progress);
        setElapsed(progressInfo.elapsed);
        setDuration(progressInfo.duration);
        rafIdRef.current = requestAnimationFrame(updateProgress);
      }
    };

    rafIdRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setProgress(0);
    setElapsed(0);
    setDuration(0);
  }, []);

  const playBuffer = useCallback((buffer: AudioBuffer, buttonId?: string) => {
    if (!serviceRef.current) return;

    // Stop any current playback and progress tracking
    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
    }
    stopProgressTracking();

    setIsPlaying(true);
    setPlayingButtonId(buttonId ?? null);
    setDuration(buffer.duration);

    const handle = serviceRef.current.play(buffer, buttonId);
    currentHandleRef.current = handle;

    // Start progress tracking
    startProgressTracking();

    handle.onEnded.then(() => {
      if (currentHandleRef.current === handle) {
        setIsPlaying(false);
        setPlayingButtonId(null);
        stopProgressTracking();
        currentHandleRef.current = null;
      }
    });
  }, [startProgressTracking, stopProgressTracking]);

  const playBlob = useCallback(
    async (blob: Blob, buttonId?: string) => {
      if (!serviceRef.current) return;

      // Ensure initialized
      if (!serviceRef.current.isReady()) {
        await initialize();
      }

      try {
        const buffer = await serviceRef.current.decodeAudio(blob);
        playBuffer(buffer, buttonId);
      } catch (error) {
        // Clear playing state on decode error (002-audio-feedback T029)
        setIsPlaying(false);
        setPlayingButtonId(null);
        stopProgressTracking();
        throw error;
      }
    },
    [initialize, playBuffer, stopProgressTracking]
  );

  // Alias for UseAudioWithFeedbackReturn compatibility
  const play = useCallback(
    async (audioBlob: Blob, buttonId: string) => {
      await playBlob(audioBlob, buttonId);
    },
    [playBlob]
  );

  const stop = useCallback(() => {
    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
      currentHandleRef.current = null;
      setIsPlaying(false);
      setPlayingButtonId(null);
      stopProgressTracking();
    }
  }, [stopProgressTracking]);

  // Stop all audio playback and reset state (002-audio-feedback)
  const stopAll = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopAll();
    }
    currentHandleRef.current = null;
    setIsPlaying(false);
    setPlayingButtonId(null);
    stopProgressTracking();
  }, [stopProgressTracking]);

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
    play,
    stop,
    stopAll,
    decodeAudio,
    // Playback feedback state (002-audio-feedback)
    playingButtonId,
    progress,
    elapsed,
    duration,
  };
}
