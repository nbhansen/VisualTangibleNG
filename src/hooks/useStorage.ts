/**
 * useStorage Hook
 *
 * React hook wrapping StorageService for component use.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStorageService, StorageService } from '../services/storage';
import type { BoardWithButtons, GridLayout, Image, Audio, LabelPosition } from '../types';

interface UseStorageReturn {
  isInitialized: boolean;
  error: string | null;
  loadBoard: () => Promise<BoardWithButtons | null>;
  updateLayout: (layout: GridLayout) => Promise<void>;
  saveImage: (
    buttonId: string,
    blob: Blob,
    mimeType: Image['mimeType'],
    width: number,
    height: number
  ) => Promise<Image>;
  deleteImage: (imageId: string) => Promise<void>;
  saveAudio: (
    buttonId: string,
    blob: Blob,
    mimeType: Audio['mimeType'],
    duration: number
  ) => Promise<Audio>;
  deleteAudio: (audioId: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  // Label operations (003-button-text)
  updateButtonLabel: (buttonId: string, label: string | null) => Promise<void>;
  updateBoardLabelPosition: (boardId: string, position: LabelPosition) => Promise<void>;
}

export function useStorage(): UseStorageReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<StorageService | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const service = getStorageService();
        await service.initialize();
        serviceRef.current = service;
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize storage');
      }
    };

    init();
  }, []);

  const getService = useCallback(() => {
    if (!serviceRef.current) {
      throw new Error('Storage not initialized');
    }
    return serviceRef.current;
  }, []);

  const loadBoard = useCallback(async (): Promise<BoardWithButtons | null> => {
    try {
      return await getService().getBoardWithButtons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
      return null;
    }
  }, [getService]);

  const updateLayout = useCallback(
    async (layout: GridLayout): Promise<void> => {
      try {
        await getService().updateBoardLayout(layout);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update layout');
      }
    },
    [getService]
  );

  const saveImage = useCallback(
    async (
      buttonId: string,
      blob: Blob,
      mimeType: Image['mimeType'],
      width: number,
      height: number
    ): Promise<Image> => {
      return await getService().saveImage(buttonId, blob, mimeType, width, height);
    },
    [getService]
  );

  const deleteImage = useCallback(
    async (imageId: string): Promise<void> => {
      await getService().deleteImage(imageId);
    },
    [getService]
  );

  const saveAudio = useCallback(
    async (
      buttonId: string,
      blob: Blob,
      mimeType: Audio['mimeType'],
      duration: number
    ): Promise<Audio> => {
      return await getService().saveAudio(buttonId, blob, mimeType, duration);
    },
    [getService]
  );

  const deleteAudio = useCallback(
    async (audioId: string): Promise<void> => {
      await getService().deleteAudio(audioId);
    },
    [getService]
  );

  const resetAllData = useCallback(async (): Promise<void> => {
    await getService().resetAllData();
  }, [getService]);

  // Update button label (003-button-text)
  const updateButtonLabel = useCallback(
    async (buttonId: string, label: string | null): Promise<void> => {
      await getService().updateButtonLabel(buttonId, label);
    },
    [getService]
  );

  // Update board label position (003-button-text)
  const updateBoardLabelPosition = useCallback(
    async (boardId: string, position: LabelPosition): Promise<void> => {
      await getService().updateBoardLabelPosition(boardId, position);
    },
    [getService]
  );

  return {
    isInitialized,
    error,
    loadBoard,
    updateLayout,
    saveImage,
    deleteImage,
    saveAudio,
    deleteAudio,
    resetAllData,
    updateButtonLabel,
    updateBoardLabelPosition,
  };
}
