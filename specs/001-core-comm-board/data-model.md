# Data Model: Core Communication Board

**Feature**: 001-core-comm-board
**Date**: 2025-12-01

## Entity Relationship Diagram

```text
┌─────────────────────┐
│      AppState       │
├─────────────────────┤
│ pinHash: string?    │
│ isFirstRun: bool    │
│ version: string     │
└─────────┬───────────┘
          │ 1:1
          ▼
┌─────────────────────┐
│       Board         │
├─────────────────────┤
│ id: string (uuid)   │
│ layout: GridLayout  │
│ createdAt: Date     │
│ updatedAt: Date     │
└─────────┬───────────┘
          │ 1:N
          ▼
┌─────────────────────┐
│       Button        │
├─────────────────────┤
│ id: string (uuid)   │
│ boardId: string     │
│ position: number    │
│ imageId: string?    │
│ audioId: string?    │
│ createdAt: Date     │
│ updatedAt: Date     │
└─────────┬───────────┘
          │ 1:0..1       1:0..1
          ▼              ▼
┌─────────────────┐  ┌─────────────────┐
│     Image       │  │     Audio       │
├─────────────────┤  ├─────────────────┤
│ id: string      │  │ id: string      │
│ buttonId: string│  │ buttonId: string│
│ blob: Blob      │  │ blob: Blob      │
│ mimeType: string│  │ mimeType: string│
│ width: number   │  │ duration: number│
│ height: number  │  │ createdAt: Date │
│ createdAt: Date │  └─────────────────┘
└─────────────────┘
```

## Entities

### AppState

Application-level settings stored as a single record.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Always "app-state" (singleton) |
| pinHash | string | No | SHA-256 hash of edit mode PIN (hex). Null if not set. |
| isFirstRun | boolean | Yes | True until first PIN is created |
| version | string | Yes | Data schema version for migrations |

**Validation Rules**:
- `pinHash` must be 64 characters (SHA-256 hex) when present
- `version` follows semver format

### Board

Represents a communication board containing buttons.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID v4 |
| layout | GridLayout | Yes | Number of buttons to display |
| createdAt | Date | Yes | ISO 8601 timestamp |
| updatedAt | Date | Yes | ISO 8601 timestamp |

**GridLayout Enum**:
```typescript
type GridLayout = 1 | 2 | 4 | 9 | 16;
```

**Validation Rules**:
- `layout` must be one of: 1, 2, 4, 9, 16
- Only one Board exists in MVP (singleton pattern)

**Grid Arrangements**:
| Layout | Rows | Columns |
|--------|------|---------|
| 1 | 1 | 1 |
| 2 | 1 | 2 |
| 4 | 2 | 2 |
| 9 | 3 | 3 |
| 16 | 4 | 4 |

### Button

A single communication button on the board.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID v4 |
| boardId | string | Yes | Foreign key to Board |
| position | number | Yes | 0-indexed position in grid (left-to-right, top-to-bottom) |
| imageId | string | No | Foreign key to Image (null if no image) |
| audioId | string | No | Foreign key to Audio (null if no audio) |
| createdAt | Date | Yes | ISO 8601 timestamp |
| updatedAt | Date | Yes | ISO 8601 timestamp |

**Validation Rules**:
- `position` must be 0-15 (supports up to 16 buttons)
- `position` must be unique within a board
- Buttons without imageId and audioId are valid (empty placeholder)

**State Transitions**:
```text
Empty → HasImage → HasImageAndAudio
Empty → HasAudio → HasImageAndAudio
HasImageAndAudio → HasImage (audio deleted)
HasImageAndAudio → HasAudio (image deleted)
Any → Empty (content cleared)
```

### Image

An image associated with a button.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID v4 |
| buttonId | string | Yes | Foreign key to Button |
| blob | Blob | Yes | Image binary data |
| mimeType | string | Yes | MIME type (image/webp, image/jpeg, image/png) |
| width | number | Yes | Image width in pixels |
| height | number | Yes | Image height in pixels |
| createdAt | Date | Yes | ISO 8601 timestamp |

**Validation Rules**:
- `mimeType` must be one of: image/webp, image/jpeg, image/png
- `width` and `height` must be <= 512 (resized on import)
- `blob` size should be < 500KB after resize

### Audio

An audio recording associated with a button.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | UUID v4 |
| buttonId | string | Yes | Foreign key to Button |
| blob | Blob | Yes | Audio binary data |
| mimeType | string | Yes | MIME type (audio/webm, audio/mp4) |
| duration | number | Yes | Duration in seconds |
| createdAt | Date | Yes | ISO 8601 timestamp |

**Validation Rules**:
- `mimeType` must be one of: audio/webm, audio/mp4, audio/ogg
- `duration` must be <= 30 seconds
- `blob` size should be < 100KB typically

## IndexedDB Schema

```typescript
interface DBSchema {
  appState: {
    key: string;
    value: AppState;
  };
  boards: {
    key: string;
    value: Board;
    indexes: { 'by-updated': Date };
  };
  buttons: {
    key: string;
    value: Button;
    indexes: {
      'by-board': string;
      'by-position': [string, number]; // [boardId, position]
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
```

**Database Name**: `visual-tangible-ng`
**Version**: 1

## Data Lifecycle

### Board Creation (First Run)
1. App detects no Board exists
2. Create Board with default layout (4 buttons)
3. Create 16 empty Button records (positions 0-15)
4. Only buttons 0-3 visible initially (layout=4)

### Image Import Flow
1. User selects image from device
2. Image resized to max 512px dimension
3. Converted to WebP (or JPEG fallback)
4. Stored as Image record
5. Button.imageId updated

### Audio Recording Flow
1. User taps record
2. MediaRecorder captures audio
3. Auto-stop at 30 seconds
4. Stored as Audio record
5. Button.audioId updated

### Content Deletion
1. Delete Image/Audio record
2. Set Button.imageId/audioId to null
3. Button record preserved (position maintained)

### Layout Change
1. Update Board.layout
2. All Button records preserved
3. Only buttons with position < layout are displayed

## Storage Estimates

| Content | Size per Item | Max Items | Total |
|---------|---------------|-----------|-------|
| App State | ~100 bytes | 1 | 100 bytes |
| Board | ~200 bytes | 1 | 200 bytes |
| Buttons | ~200 bytes | 16 | 3.2 KB |
| Images | ~100-500 KB | 16 | 8 MB |
| Audio | ~30-100 KB | 16 | 1.6 MB |
| **Total** | - | - | **~10 MB** |

Conservative estimate: ~10 MB for a fully populated 16-button board.

## Migration Strategy

Version stored in AppState.version. On app load:

```typescript
async function migrateIfNeeded(db: IDBDatabase) {
  const state = await db.get('appState', 'app-state');
  if (!state || state.version < CURRENT_VERSION) {
    // Run migrations sequentially
    // Update version after each successful migration
  }
}
```

For MVP (v1), no migrations needed. Future versions will add migration scripts.
