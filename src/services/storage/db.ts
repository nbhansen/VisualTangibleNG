/**
 * IndexedDB Database Initialization
 *
 * Sets up the IndexedDB schema for the Visual Tangible NG app.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { AppState, Board, Button, Image, Audio } from '../../types';

// Database name and version
export const DB_NAME = 'visual-tangible-ng';
export const DB_VERSION = 1;

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
 */
export async function initDB(): Promise<IDBPDatabase<VisualTangibleDB>> {
  return openDB<VisualTangibleDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
    },
  });
}
