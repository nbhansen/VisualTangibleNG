/**
 * IndexedDB Database Initialization
 *
 * Sets up the IndexedDB schema for the Visual Tangible NG app.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { AppState, Board, Button, Image, Audio } from '../../types';

// Database name and version
export const DB_NAME = 'visual-tangible-ng';
export const DB_VERSION = 3;

// Schema version stored in AppState for migrations
export const SCHEMA_VERSION = '1.0.0';

/**
 * IndexedDB Schema Definition
 */
export interface VisualTangibleDB extends DBSchema {
  appState: {
    key: string;
    value: AppState;
  };
  boards: {
    key: string;
    value: Board;
    indexes: { 'by-updated': string };
  };
  buttons: {
    key: string;
    value: Button;
    indexes: {
      'by-board': string;
      'by-position': [string, number];
    };
  };
  images: {
    key: string;
    value: Image;
    indexes: { 'by-button': string };
  };
  audio: {
    key: string;
    value: Audio;
    indexes: { 'by-button': string };
  };
}

/**
 * Initialize the IndexedDB database with schema.
 * Creates object stores and indexes on first run.
 * Handles migrations for schema changes.
 */
export async function initDB(): Promise<IDBPDatabase<VisualTangibleDB>> {
  return openDB<VisualTangibleDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // AppState store (singleton)
      if (!db.objectStoreNames.contains('appState')) {
        db.createObjectStore('appState', { keyPath: 'id' });
      }

      // Boards store
      if (!db.objectStoreNames.contains('boards')) {
        const boardsStore = db.createObjectStore('boards', { keyPath: 'id' });
        boardsStore.createIndex('by-updated', 'updatedAt');
      }

      // Buttons store
      if (!db.objectStoreNames.contains('buttons')) {
        const buttonsStore = db.createObjectStore('buttons', { keyPath: 'id' });
        buttonsStore.createIndex('by-board', 'boardId');
        buttonsStore.createIndex('by-position', ['boardId', 'position']);
      }

      // Images store
      if (!db.objectStoreNames.contains('images')) {
        const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
        imagesStore.createIndex('by-button', 'buttonId');
      }

      // Audio store
      if (!db.objectStoreNames.contains('audio')) {
        const audioStore = db.createObjectStore('audio', { keyPath: 'id' });
        audioStore.createIndex('by-button', 'buttonId');
      }

      // Migration v1 → v2: Add labelPosition to boards, label to buttons (003-button-text)
      if (oldVersion < 2) {
        // Migrate existing boards to have default labelPosition
        const boardsStore = transaction.objectStore('boards');
        boardsStore.openCursor().then(function migrateBoardsCursor(cursor) {
          if (!cursor) return;
          const board = cursor.value as Board & { labelPosition?: string };
          if (!board.labelPosition) {
            board.labelPosition = 'below';
            cursor.update(board);
          }
          cursor.continue().then(migrateBoardsCursor);
        });

        // Migrate existing buttons to have default label
        const buttonsStore = transaction.objectStore('buttons');
        buttonsStore.openCursor().then(function migrateButtonsCursor(cursor) {
          if (!cursor) return;
          const button = cursor.value as Button & { label?: string | null };
          if (button.label === undefined) {
            button.label = null;
            cursor.update(button);
          }
          cursor.continue().then(migrateButtonsCursor);
        });
      }

      // Migration v2 → v3: Add freeform board fields (004-freeform-board)
      if (oldVersion < 3) {
        // Migrate existing boards to have freeform defaults
        const boardsStore = transaction.objectStore('boards');
        boardsStore.openCursor().then(function migrateBoardsV3(cursor) {
          if (!cursor) return;
          const board = cursor.value as Board & {
            mode?: string;
            canvasWidth?: number;
            canvasHeight?: number;
            viewportZoom?: number;
            viewportPanX?: number;
            viewportPanY?: number;
          };
          let needsUpdate = false;
          if (board.mode === undefined) {
            board.mode = 'grid';
            needsUpdate = true;
          }
          if (board.canvasWidth === undefined) {
            board.canvasWidth = 1920;
            needsUpdate = true;
          }
          if (board.canvasHeight === undefined) {
            board.canvasHeight = 1080;
            needsUpdate = true;
          }
          if (board.viewportZoom === undefined) {
            board.viewportZoom = 1;
            needsUpdate = true;
          }
          if (board.viewportPanX === undefined) {
            board.viewportPanX = 0;
            needsUpdate = true;
          }
          if (board.viewportPanY === undefined) {
            board.viewportPanY = 0;
            needsUpdate = true;
          }
          if (needsUpdate) {
            cursor.update(board as Board);
          }
          cursor.continue().then(migrateBoardsV3);
        });

        // Migrate existing buttons to have freeform position defaults (null)
        const buttonsStore = transaction.objectStore('buttons');
        buttonsStore.openCursor().then(function migrateButtonsV3(cursor) {
          if (!cursor) return;
          const button = cursor.value as Button & {
            x?: number | null;
            y?: number | null;
            width?: number | null;
            height?: number | null;
            zIndex?: number | null;
          };
          let needsUpdate = false;
          if (button.x === undefined) {
            button.x = null;
            needsUpdate = true;
          }
          if (button.y === undefined) {
            button.y = null;
            needsUpdate = true;
          }
          if (button.width === undefined) {
            button.width = null;
            needsUpdate = true;
          }
          if (button.height === undefined) {
            button.height = null;
            needsUpdate = true;
          }
          if (button.zIndex === undefined) {
            button.zIndex = null;
            needsUpdate = true;
          }
          if (needsUpdate) {
            cursor.update(button as Button);
          }
          cursor.continue().then(migrateButtonsV3);
        });
      }
    },
  });
}
