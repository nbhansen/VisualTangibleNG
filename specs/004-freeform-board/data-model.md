# Data Model: Freeform Board Layout

**Feature**: 004-freeform-board
**Date**: 2025-12-01

## Entity Changes

This feature significantly extends the Button and Board entities from 001-core-comm-board.

### Button (Extended)

Adds position, size, and z-index for freeform layout.

| Field | Type | Required | Description | **NEW** |
|-------|------|----------|-------------|---------|
| id | string | Yes | UUID v4 | |
| boardId | string | Yes | Foreign key to Board | |
| position | number | Yes | Grid position (0-indexed) | |
| imageId | string | No | Foreign key to Image | |
| audioId | string | No | Foreign key to Audio | |
| label | string | No | Text label (from 003) | |
| **x** | number | No | X position in world coords | **NEW** |
| **y** | number | No | Y position in world coords | **NEW** |
| **width** | number | No | Width in world coords | **NEW** |
| **height** | number | No | Height in world coords | **NEW** |
| **zIndex** | number | No | Stacking order (higher = front) | **NEW** |
| createdAt | Date | Yes | ISO 8601 timestamp | |
| updatedAt | Date | Yes | ISO 8601 timestamp | |

**Validation Rules** (new):
- `x`, `y` must be >= 0 when in freeform mode
- `width`, `height` must be >= 44 (minimum touch target)
- `zIndex` must be >= 0
- Position fields are null/undefined in grid mode

### Board (Extended)

Adds board mode and viewport state.

| Field | Type | Required | Description | **NEW** |
|-------|------|----------|-------------|---------|
| id | string | Yes | UUID v4 | |
| layout | GridLayout | Yes | Grid button count | |
| labelPosition | LabelPosition | Yes | Label placement (from 003) | |
| **mode** | BoardMode | Yes | 'grid' or 'freeform' | **NEW** |
| **canvasWidth** | number | No | Virtual canvas width | **NEW** |
| **canvasHeight** | number | No | Virtual canvas height | **NEW** |
| **viewportZoom** | number | No | Current zoom level | **NEW** |
| **viewportPanX** | number | No | Current pan X offset | **NEW** |
| **viewportPanY** | number | No | Current pan Y offset | **NEW** |
| createdAt | Date | Yes | ISO 8601 timestamp | |
| updatedAt | Date | Yes | ISO 8601 timestamp | |

**Default Values**:
- `mode`: `'grid'`
- `canvasWidth`: `1920`
- `canvasHeight`: `1080`
- `viewportZoom`: `1`
- `viewportPanX`: `0`
- `viewportPanY`: `0`

## New Types

```typescript
/**
 * Board layout mode.
 */
export type BoardMode = 'grid' | 'freeform';

/**
 * Button position and size for freeform mode.
 */
export interface ButtonPosition {
  x: number;      // World X coordinate
  y: number;      // World Y coordinate
  width: number;  // Width in world units
  height: number; // Height in world units
  zIndex: number; // Stacking order
}

/**
 * Viewport state for canvas navigation.
 */
export interface Viewport {
  zoom: number;   // Scale factor (0.5 to 2.0)
  panX: number;   // X translation in screen coords
  panY: number;   // Y translation in screen coords
}

/**
 * Canvas configuration.
 */
export interface CanvasConfig {
  width: number;  // Virtual canvas width
  height: number; // Virtual canvas height
}

/**
 * Constraints for button positioning.
 */
export const POSITION_CONSTRAINTS = {
  MIN_WIDTH: 44,
  MIN_HEIGHT: 44,
  MAX_WIDTH: 500,
  MAX_HEIGHT: 500,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
} as const;

/**
 * Extended Button type with freeform support.
 */
export interface Button {
  id: string;
  boardId: string;
  position: number;
  imageId: string | null;
  audioId: string | null;
  label: string | null;
  // Freeform position (null in grid mode)
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  zIndex: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended Board type with mode and viewport.
 */
export interface Board {
  id: string;
  layout: GridLayout;
  labelPosition: LabelPosition;
  mode: BoardMode;
  canvasWidth: number;
  canvasHeight: number;
  viewportZoom: number;
  viewportPanX: number;
  viewportPanY: number;
  createdAt: string;
  updatedAt: string;
}
```

## Database Migration

### Version Change

```typescript
// Previous version (after 003-button-text)
const DB_VERSION = 2;

// New version
const DB_VERSION = 3;
```

### Migration Logic

```typescript
function upgradeDB(
  db: IDBPDatabase<DBSchema>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<DBSchema>
) {
  // ... previous migrations ...

  if (oldVersion < 3) {
    // Migration 2 → 3: Add freeform position fields
    //
    // For Button: x, y, width, height, zIndex fields added (null by default)
    // For Board: mode, canvasWidth, canvasHeight, viewportZoom, viewportPanX, viewportPanY
    //
    // Set defaults on existing boards:
    const boardStore = transaction.objectStore('boards');
    boardStore.getAll().then(boards => {
      boards.forEach(board => {
        if (board.mode === undefined) {
          board.mode = 'grid';
          board.canvasWidth = 1920;
          board.canvasHeight = 1080;
          board.viewportZoom = 1;
          board.viewportPanX = 0;
          board.viewportPanY = 0;
          boardStore.put(board);
        }
      });
    });
  }
}
```

## State Flow Diagrams

### Grid → Freeform Transition

```text
User switches mode to Freeform
       │
       ▼
┌──────────────────┐
│ Calculate button │
│ positions from   │
│ grid layout      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ For each button: │
│ x = col * cellW  │
│ y = row * cellH  │
│ width = cellW    │
│ height = cellH   │
│ zIndex = position│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Update all       │
│ buttons in       │
│ IndexedDB        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Set board.mode   │
│ = 'freeform'     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Render canvas    │
│ with buttons at  │
│ calculated pos   │
└──────────────────┘
```

### Freeform → Grid Transition

```text
User switches mode to Grid
       │
       ▼
┌──────────────────┐
│ Sort buttons by  │
│ position (top-   │
│ left to bottom-  │
│ right)           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Assign grid      │
│ positions 0..N-1 │
│ based on sort    │
│ order            │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Keep freeform    │
│ coords (don't    │
│ null them)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Set board.mode   │
│ = 'grid'         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Render grid      │
│ (position field  │
│ determines slot) │
└──────────────────┘
```

### Drag Operation Flow

```text
User drags button in Edit Mode
       │
       ▼
┌──────────────────┐
│ onPointerDown    │
│ setPointerCapture│
│ record startPos  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ onPointerMove    │◄────────────┐
│ calculate delta  │             │
│ update local     │             │
│ position state   │             │
│ (no DB write)    │             │
└────────┬─────────┘             │
         │                       │
         ├──────── debounce ─────┤
         │        (500ms)        │
         ▼                       │
┌──────────────────┐             │
│ Debounced save   │             │
│ to IndexedDB     │─────────────┘
└────────┬─────────┘
         │
         ▼ (on release)
┌──────────────────┐
│ onPointerUp      │
│ flush debounce   │
│ final save       │
└──────────────────┘
```

## Storage Operations

### New Methods

```typescript
interface IStorageService {
  // Existing methods...

  /**
   * Update button position in freeform mode.
   */
  updateButtonPosition(
    buttonId: string,
    position: { x: number; y: number; width: number; height: number }
  ): Promise<void>;

  /**
   * Update button z-index (bring to front).
   */
  updateButtonZIndex(buttonId: string, zIndex: number): Promise<void>;

  /**
   * Update board mode.
   */
  updateBoardMode(boardId: string, mode: BoardMode): Promise<void>;

  /**
   * Update board viewport state.
   */
  updateBoardViewport(boardId: string, viewport: Viewport): Promise<void>;

  /**
   * Batch update button positions (for mode switch).
   */
  batchUpdateButtonPositions(
    updates: Array<{ buttonId: string; position: ButtonPosition }>
  ): Promise<void>;
}
```

## Export Format Update

The export ZIP includes freeform position data:

```json
{
  "version": "3.0.0",
  "board": {
    "id": "...",
    "layout": 4,
    "labelPosition": "below",
    "mode": "freeform",
    "canvasWidth": 1920,
    "canvasHeight": 1080,
    "viewportZoom": 1,
    "viewportPanX": 0,
    "viewportPanY": 0
  },
  "buttons": [
    {
      "id": "...",
      "position": 0,
      "label": "Water",
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 200,
      "zIndex": 5,
      "imageId": "...",
      "audioId": "..."
    }
  ]
}
```

## Storage Estimates

| Content | Size per Item | Max Items | Total |
|---------|---------------|-----------|-------|
| Button position fields | ~40 bytes | 50 | 2 KB |
| Board viewport fields | ~50 bytes | 1 | 50 bytes |
| **Added per board** | - | - | **~2 KB** |

Negligible storage impact.
