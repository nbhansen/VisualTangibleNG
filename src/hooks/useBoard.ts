/**
 * useBoard Hook
 *
 * React hook for board state management and audio pre-decoding.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from './useAppContext';
import { useStorage } from './useStorage';
import { useAudio } from './useAudio';
import type { ButtonWithMedia, BoardWithButtons } from '../types';

interface UseBoardReturn {
  board: BoardWithButtons | null;
  isLoading: boolean;
  error: string | null;
  playButtonAudio: (button: ButtonWithMedia) => void;
  refreshBoard: () => Promise<void>;
}

export function useBoard(): UseBoardReturn {
  const { state, setBoard, setLoading, setError } = useAppContext();
  const { isInitialized, loadBoard } = useStorage();
  const { initialize: initAudio, playBuffer, decodeAudio } = useAudio();

  // Track decoded audio buffers
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Pre-decode audio for visible buttons
  const preDecodeAudio = useCallback(
    async (board: BoardWithButtons) => {
      const visibleButtons = board.buttons.slice(0, board.layout);

      for (const button of visibleButtons) {
        if (button.audio && button.audio.blob && !audioBuffersRef.current.has(button.id)) {
          try {
            const buffer = await decodeAudio(button.audio.blob);
            audioBuffersRef.current.set(button.id, buffer);

            // Update button with decoded buffer
            setBoard({
              ...board,
              buttons: board.buttons.map((b) =>
                b.id === button.id ? { ...b, audioBuffer: buffer } : b
              ),
            });
          } catch (err) {
            console.warn(`Failed to decode audio for button ${button.id}:`, err);
          }
        }
      }
    },
    [decodeAudio, setBoard]
  );

  // Load board on initialization
  useEffect(() => {
    if (isInitialized && !state.board) {
      const load = async () => {
        setLoading(true);
        const board = await loadBoard();
        if (board) {
          setBoard(board);
          await preDecodeAudio(board);
        }
        setLoading(false);
      };
      load();
    }
  }, [isInitialized, state.board, loadBoard, setBoard, setLoading, preDecodeAudio]);

  // Play audio for a button
  const playButtonAudio = useCallback(
    async (button: ButtonWithMedia) => {
      // Initialize audio context on first interaction
      await initAudio();

      // Try cached buffer first
      let buffer = audioBuffersRef.current.get(button.id);

      // If not cached, try the button's buffer
      if (!buffer && button.audioBuffer) {
        buffer = button.audioBuffer;
      }

      // If still no buffer but has audio blob, decode it
      if (!buffer && button.audio?.blob) {
        try {
          buffer = await decodeAudio(button.audio.blob);
          audioBuffersRef.current.set(button.id, buffer);
        } catch (err) {
          setError(`Failed to play audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
          return;
        }
      }

      if (buffer) {
        playBuffer(buffer);
      }
    },
    [initAudio, decodeAudio, playBuffer, setError]
  );

  // Refresh board from storage
  const refreshBoard = useCallback(async () => {
    setLoading(true);
    audioBuffersRef.current.clear();
    const board = await loadBoard();
    if (board) {
      setBoard(board);
      await preDecodeAudio(board);
    }
    setLoading(false);
  }, [loadBoard, setBoard, setLoading, preDecodeAudio]);

  return {
    board: state.board,
    isLoading: state.isLoading,
    error: state.error,
    playButtonAudio,
    refreshBoard,
  };
}
