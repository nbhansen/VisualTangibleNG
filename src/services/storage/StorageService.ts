/**
 * Storage Service Implementation
 *
 * Implements IStorageService interface for IndexedDB operations.
 */

import type { IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type {
  AppState,
  Board,
  Button,
  Image,
  Audio,
  GridLayout,
  BoardWithButtons,
  ButtonWithMedia,
  LabelPosition,
} from '../../types';
import type { IStorageService } from '../../types/storage';
import { initDB, SCHEMA_VERSION, type VisualTangibleDB } from './db';

const DEFAULT_LAYOUT: GridLayout = 4;
const MAX_BUTTONS = 16;

export class StorageService implements IStorageService {
  private db: IDBPDatabase<VisualTangibleDB> | null = null;

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await initDB();
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDB(): IDBPDatabase<VisualTangibleDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // ---------------------------------------------------------------------------
  // App State
  // ---------------------------------------------------------------------------

  async getAppState(): Promise<AppState> {
    const db = this.getDB();
    let state = await db.get('appState', 'app-state');

    if (!state) {
      state = {
        id: 'app-state',
        pinHash: null,
        isFirstRun: true,
        version: SCHEMA_VERSION,
      };
      await db.put('appState', state);
    }

    return state;
  }

  async updateAppState(updates: Partial<Omit<AppState, 'id'>>): Promise<AppState> {
    const db = this.getDB();
    const current = await this.getAppState();
    const updated: AppState = { ...current, ...updates };
    await db.put('appState', updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Board Operations
  // ---------------------------------------------------------------------------

  async getBoard(): Promise<Board> {
    const db = this.getDB();
    const boards = await db.getAll('boards');

    if (boards.length === 0) {
      // Create default board with 16 empty buttons
      const board = await this.createDefaultBoard();
      return board;
    }

    return boards[0];
  }

  private async createDefaultBoard(): Promise<Board> {
    const db = this.getDB();
    const now = new Date().toISOString();
    const boardId = uuidv4();

    const board: Board = {
      id: boardId,
      layout: DEFAULT_LAYOUT,
      labelPosition: 'below', // (003-button-text)
      createdAt: now,
      updatedAt: now,
    };

    await db.put('boards', board);

    // Create 16 empty buttons
    const tx = db.transaction('buttons', 'readwrite');
    for (let i = 0; i < MAX_BUTTONS; i++) {
      const button: Button = {
        id: uuidv4(),
        boardId,
        position: i,
        imageId: null,
        audioId: null,
        label: null, // (003-button-text)
        createdAt: now,
        updatedAt: now,
      };
      await tx.store.put(button);
    }
    await tx.done;

    return board;
  }

  async getBoardWithButtons(): Promise<BoardWithButtons> {
    const board = await this.getBoard();
    const buttons = await this.getButtonsByBoard(board.id);

    // Load media for each button
    const buttonsWithMedia: ButtonWithMedia[] = await Promise.all(
      buttons.map(async (button) => {
        const image = button.imageId ? await this.getImage(button.imageId) : null;
        const audio = button.audioId ? await this.getAudio(button.audioId) : null;

        return {
          ...button,
          image,
          audio,
          imageUrl: image ? URL.createObjectURL(image.blob) : null,
          audioBuffer: null, // Decoded on demand by audio service
        };
      })
    );

    return {
      ...board,
      buttons: buttonsWithMedia,
    };
  }

  async updateBoardLayout(layout: GridLayout): Promise<Board> {
    const db = this.getDB();
    const board = await this.getBoard();

    const updated: Board = {
      ...board,
      layout,
      updatedAt: new Date().toISOString(),
    };

    await db.put('boards', updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Button Operations
  // ---------------------------------------------------------------------------

  async getButton(id: string): Promise<Button | null> {
    const db = this.getDB();
    const button = await db.get('buttons', id);
    return button ?? null;
  }

  async getButtonsByBoard(boardId: string): Promise<Button[]> {
    const db = this.getDB();
    const buttons = await db.getAllFromIndex('buttons', 'by-board', boardId);
    return buttons.sort((a, b) => a.position - b.position);
  }

  async updateButtonImage(buttonId: string, imageId: string | null): Promise<Button> {
    const db = this.getDB();
    const button = await this.getButton(buttonId);

    if (!button) {
      throw new Error(`Button not found: ${buttonId}`);
    }

    const updated: Button = {
      ...button,
      imageId,
      updatedAt: new Date().toISOString(),
    };

    await db.put('buttons', updated);
    return updated;
  }

  async updateButtonAudio(buttonId: string, audioId: string | null): Promise<Button> {
    const db = this.getDB();
    const button = await this.getButton(buttonId);

    if (!button) {
      throw new Error(`Button not found: ${buttonId}`);
    }

    const updated: Button = {
      ...button,
      audioId,
      updatedAt: new Date().toISOString(),
    };

    await db.put('buttons', updated);
    return updated;
  }

  /**
   * Update a button's text label (003-button-text)
   */
  async updateButtonLabel(buttonId: string, label: string | null): Promise<Button> {
    const db = this.getDB();
    const button = await this.getButton(buttonId);

    if (!button) {
      throw new Error(`Button not found: ${buttonId}`);
    }

    const updated: Button = {
      ...button,
      label,
      updatedAt: new Date().toISOString(),
    };

    await db.put('buttons', updated);
    return updated;
  }

  /**
   * Update the board's label position setting (003-button-text)
   */
  async updateBoardLabelPosition(boardId: string, labelPosition: LabelPosition): Promise<Board> {
    const db = this.getDB();
    const board = await db.get('boards', boardId);

    if (!board) {
      throw new Error(`Board not found: ${boardId}`);
    }

    const updated: Board = {
      ...board,
      labelPosition,
      updatedAt: new Date().toISOString(),
    };

    await db.put('boards', updated);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Image Operations
  // ---------------------------------------------------------------------------

  async getImage(id: string): Promise<Image | null> {
    const db = this.getDB();
    const image = await db.get('images', id);
    return image ?? null;
  }

  async getImageByButton(buttonId: string): Promise<Image | null> {
    const db = this.getDB();
    const images = await db.getAllFromIndex('images', 'by-button', buttonId);
    return images[0] ?? null;
  }

  async saveImage(
    buttonId: string,
    blob: Blob,
    mimeType: Image['mimeType'],
    width: number,
    height: number
  ): Promise<Image> {
    const db = this.getDB();

    // Delete existing image if any
    const existing = await this.getImageByButton(buttonId);
    if (existing) {
      await this.deleteImage(existing.id);
    }

    const image: Image = {
      id: uuidv4(),
      buttonId,
      blob,
      mimeType,
      width,
      height,
      createdAt: new Date().toISOString(),
    };

    await db.put('images', image);
    await this.updateButtonImage(buttonId, image.id);

    return image;
  }

  async deleteImage(id: string): Promise<void> {
    const db = this.getDB();
    const image = await this.getImage(id);

    if (image) {
      await db.delete('images', id);
      // Clear button reference
      const button = await this.getButtonByImageId(id);
      if (button) {
        await this.updateButtonImage(button.id, null);
      }
    }
  }

  private async getButtonByImageId(imageId: string): Promise<Button | null> {
    const db = this.getDB();
    const buttons = await db.getAll('buttons');
    return buttons.find((b) => b.imageId === imageId) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Audio Operations
  // ---------------------------------------------------------------------------

  async getAudio(id: string): Promise<Audio | null> {
    const db = this.getDB();
    const audio = await db.get('audio', id);
    return audio ?? null;
  }

  async getAudioByButton(buttonId: string): Promise<Audio | null> {
    const db = this.getDB();
    const audioList = await db.getAllFromIndex('audio', 'by-button', buttonId);
    return audioList[0] ?? null;
  }

  async saveAudio(
    buttonId: string,
    blob: Blob,
    mimeType: Audio['mimeType'],
    duration: number
  ): Promise<Audio> {
    const db = this.getDB();

    // Delete existing audio if any
    const existing = await this.getAudioByButton(buttonId);
    if (existing) {
      await this.deleteAudio(existing.id);
    }

    const audio: Audio = {
      id: uuidv4(),
      buttonId,
      blob,
      mimeType,
      duration,
      createdAt: new Date().toISOString(),
    };

    await db.put('audio', audio);
    await this.updateButtonAudio(buttonId, audio.id);

    return audio;
  }

  async deleteAudio(id: string): Promise<void> {
    const db = this.getDB();
    const audio = await this.getAudio(id);

    if (audio) {
      await db.delete('audio', id);
      // Clear button reference
      const button = await this.getButtonByAudioId(id);
      if (button) {
        await this.updateButtonAudio(button.id, null);
      }
    }
  }

  private async getButtonByAudioId(audioId: string): Promise<Button | null> {
    const db = this.getDB();
    const buttons = await db.getAll('buttons');
    return buttons.find((b) => b.audioId === audioId) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------------------------

  async clearBoardContent(boardId: string): Promise<void> {
    const db = this.getDB();
    const buttons = await this.getButtonsByBoard(boardId);

    for (const button of buttons) {
      if (button.imageId) {
        await db.delete('images', button.imageId);
      }
      if (button.audioId) {
        await db.delete('audio', button.audioId);
      }
      await this.updateButtonImage(button.id, null);
      await this.updateButtonAudio(button.id, null);
    }
  }

  async resetAllData(): Promise<void> {
    const db = this.getDB();

    // Clear all stores
    const tx = db.transaction(['appState', 'boards', 'buttons', 'images', 'audio'], 'readwrite');

    await tx.objectStore('audio').clear();
    await tx.objectStore('images').clear();
    await tx.objectStore('buttons').clear();
    await tx.objectStore('boards').clear();
    await tx.objectStore('appState').clear();

    await tx.done;

    // Reinitialize with defaults
    await this.getAppState();
    await this.getBoard();
  }
}

// Singleton instance
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}
