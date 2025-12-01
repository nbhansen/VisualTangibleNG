# Data Model: Button Text Labels

**Feature**: 003-button-text
**Date**: 2025-12-01

## Entity Changes

This feature extends two existing entities from 001-core-comm-board.

### Button (Extended)

Adds optional text label to each button.

| Field | Type | Required | Description | **NEW** |
|-------|------|----------|-------------|---------|
| id | string | Yes | UUID v4 | |
| boardId | string | Yes | Foreign key to Board | |
| position | number | Yes | 0-indexed position in grid | |
| imageId | string | No | Foreign key to Image | |
| audioId | string | No | Foreign key to Audio | |
| **label** | string | No | Text label, max 50 chars | **NEW** |
| createdAt | Date | Yes | ISO 8601 timestamp | |
| updatedAt | Date | Yes | ISO 8601 timestamp | |

**Validation Rules** (new):
- `label` must be null or string with length 1-50
- `label` is trimmed before storage (no leading/trailing whitespace)

### Board (Extended)

Adds label position configuration.

| Field | Type | Required | Description | **NEW** |
|-------|------|----------|-------------|---------|
| id | string | Yes | UUID v4 | |
| layout | GridLayout | Yes | Number of buttons to display | |
| **labelPosition** | LabelPosition | Yes | Where to show labels | **NEW** |
| createdAt | Date | Yes | ISO 8601 timestamp | |
| updatedAt | Date | Yes | ISO 8601 timestamp | |

**LabelPosition Enum**:
```typescript
type LabelPosition = 'above' | 'below' | 'hidden';
```

**Default Value**: `'below'`

## New Types

```typescript
/**
 * Position for text labels relative to button image.
 */
export type LabelPosition = 'above' | 'below' | 'hidden';

/**
 * Extended Button type with label support.
 */
export interface Button {
  id: string;
  boardId: string;
  position: number;
  imageId: string | null;
  audioId: string | null;
  label: string | null;  // NEW
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended Board type with label position.
 */
export interface Board {
  id: string;
  layout: GridLayout;
  labelPosition: LabelPosition;  // NEW
  createdAt: string;
  updatedAt: string;
}
```

## Database Migration

### Version Change

```typescript
// Previous version
const DB_VERSION = 1;

// New version
const DB_VERSION = 2;
```

### Migration Logic

```typescript
function upgradeDB(
  db: IDBPDatabase<DBSchema>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<DBSchema>
) {
  if (oldVersion < 2) {
    // Migration 1 → 2: Add label fields
    //
    // For Button: label field added (null by default)
    // For Board: labelPosition field added ('below' by default)
    //
    // IndexedDB doesn't require explicit schema changes for new fields.
    // Existing records will have undefined for new fields.
    // Application code handles undefined as null/'below'.

    // Optional: Iterate existing boards to set default labelPosition
    const boardStore = transaction.objectStore('boards');
    boardStore.openCursor().then(function iterate(cursor) {
      if (!cursor) return;
      const board = cursor.value;
      if (board.labelPosition === undefined) {
        board.labelPosition = 'below';
        cursor.update(board);
      }
      cursor.continue().then(iterate);
    });
  }
}
```

### Backwards Compatibility

- Existing buttons with `label: undefined` are treated as `label: null` (no label)
- Existing boards with `labelPosition: undefined` are treated as `'below'`
- No data loss during migration
- App works with partially migrated data

## Storage Operations

### Button Label Operations

```typescript
interface IStorageService {
  // Existing
  getButton(id: string): Promise<Button | null>;
  updateButtonImage(buttonId: string, imageId: string | null): Promise<void>;
  updateButtonAudio(buttonId: string, audioId: string | null): Promise<void>;

  // New
  updateButtonLabel(buttonId: string, label: string | null): Promise<void>;
}
```

### Board Label Position Operations

```typescript
interface IStorageService {
  // Existing
  getBoard(id: string): Promise<Board | null>;
  updateBoardLayout(boardId: string, layout: GridLayout): Promise<void>;

  // New
  updateBoardLabelPosition(boardId: string, position: LabelPosition): Promise<void>;
}
```

## Data Flow

### Adding a Label

```text
User types in label input
       │
       ▼
┌──────────────────┐
│ Validate length  │
│ (1-50 chars)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Trim whitespace  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ storageService   │
│ .updateButtonLabel│
│ (buttonId, label)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ IndexedDB update │
│ Button.label =   │
│ "Water"          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ UI re-renders    │
│ Label visible    │
└──────────────────┘
```

### Changing Label Position

```text
User selects "Above" in settings
       │
       ▼
┌──────────────────┐
│ storageService   │
│ .updateBoard     │
│ LabelPosition    │
│ (boardId,'above')│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ IndexedDB update │
│ Board.label      │
│ Position='above' │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ All buttons      │
│ re-render with   │
│ labels above     │
└──────────────────┘
```

## Export Format Update

The export ZIP format includes label data:

```json
{
  "version": "2.0.0",
  "board": {
    "id": "...",
    "layout": 4,
    "labelPosition": "below"
  },
  "buttons": [
    {
      "id": "...",
      "position": 0,
      "label": "Water",
      "imageId": "...",
      "audioId": "..."
    }
  ]
}
```

## Storage Estimates

| Content | Size per Item | Max Items | Total |
|---------|---------------|-----------|-------|
| Button.label | ~50 bytes | 16 | 800 bytes |
| Board.labelPosition | ~10 bytes | 1 | 10 bytes |
| **Added** | - | - | **~810 bytes** |

Negligible storage impact.
