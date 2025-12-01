# Quickstart: Button Text Labels

**Feature**: 003-button-text
**Prerequisites**: 001-core-comm-board must be complete

## Overview

This feature adds text labels to communication buttons:
1. **Label display** - Text shown below (default), above, or hidden
2. **Label editing** - Text input in ButtonEditor
3. **Position config** - Board-level setting for label placement

## Implementation Steps

### Step 1: Update Types

Extend `src/types/index.ts`:

```typescript
// Add LabelPosition type
export type LabelPosition = 'above' | 'below' | 'hidden';

// Extend Button interface
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

// Extend Board interface
export interface Board {
  id: string;
  layout: GridLayout;
  labelPosition: LabelPosition;  // NEW
  createdAt: string;
  updatedAt: string;
}
```

### Step 2: Database Migration

Update `src/services/storage/db.ts`:

```typescript
const DB_NAME = 'visual-tangible-ng';
const DB_VERSION = 2;  // Bump from 1

export async function initDB(): Promise<IDBPDatabase<DBSchema>> {
  return openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        // ... existing v1 setup ...
      }

      if (oldVersion < 2) {
        // v1 → v2: Add label fields
        // No schema changes needed - just defaults in code
        // Optionally set defaults on existing records:
        const boardStore = transaction.objectStore('boards');
        boardStore.getAll().then(boards => {
          boards.forEach(board => {
            if (board.labelPosition === undefined) {
              board.labelPosition = 'below';
              boardStore.put(board);
            }
          });
        });
      }
    },
  });
}
```

### Step 3: Storage Service Methods

Add to `src/services/storage/StorageService.ts`:

```typescript
async updateButtonLabel(buttonId: string, label: string | null): Promise<void> {
  const db = await this.getDB();
  const button = await db.get('buttons', buttonId);
  if (!button) throw new Error(`Button not found: ${buttonId}`);

  // Normalize label
  const normalizedLabel = label?.trim() || null;
  if (normalizedLabel && normalizedLabel.length > 50) {
    throw new Error('Label exceeds maximum length of 50 characters');
  }

  button.label = normalizedLabel;
  button.updatedAt = new Date().toISOString();
  await db.put('buttons', button);
}

async updateBoardLabelPosition(
  boardId: string,
  position: LabelPosition
): Promise<void> {
  const db = await this.getDB();
  const board = await db.get('boards', boardId);
  if (!board) throw new Error(`Board not found: ${boardId}`);

  board.labelPosition = position;
  board.updatedAt = new Date().toISOString();
  await db.put('boards', board);
}
```

### Step 4: Label Display in BoardButton

Update `src/components/Board/BoardButton.tsx`:

```tsx
interface BoardButtonProps {
  button: Button;
  labelPosition: LabelPosition;
  onTap: () => void;
}

export function BoardButton({
  button,
  labelPosition,
  onTap,
}: BoardButtonProps) {
  const showLabel = labelPosition !== 'hidden' && button.label;

  return (
    <button
      className="board-button"
      data-label-position={labelPosition}
      onClick={onTap}
      aria-label={button.label || 'Communication button'}
    >
      {/* Image */}
      <div className="button-image">
        {button.imageId && <img src={...} alt="" />}
      </div>

      {/* Label */}
      {showLabel && (
        <span className="button-label" dir="auto">
          {button.label}
        </span>
      )}
    </button>
  );
}
```

### Step 5: Label Styles

Add to `src/components/Board/BoardButton.css`:

```css
.board-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Label above image */
.board-button[data-label-position="above"] {
  flex-direction: column-reverse;
}

/* Label styling */
.button-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, sans-serif;
  font-weight: 500;
  font-size: clamp(10px, 3vmin, 16px);
  color: var(--label-color, #1f2937);
  text-align: center;
  max-width: 100%;
  padding: 2px 4px;

  /* Multi-line truncation */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

/* Larger labels for 1-2 button layouts */
.board[data-layout="1"] .button-label,
.board[data-layout="2"] .button-label {
  font-size: clamp(14px, 4vmin, 24px);
}

/* High contrast mode */
.high-contrast .button-label {
  color: #000000;
  background: #ffffff;
}

@media (prefers-color-scheme: dark) {
  .button-label {
    color: var(--label-color-dark, #f3f4f6);
  }
}
```

### Step 6: Label Input in ButtonEditor

Update `src/components/Editor/ButtonEditor.tsx`:

```tsx
function ButtonEditor({ button, onSave }: ButtonEditorProps) {
  const [label, setLabel] = useState(button.label || '');

  const handleSave = async () => {
    await storageService.updateButtonLabel(
      button.id,
      label.trim() || null
    );
    onSave();
  };

  return (
    <div className="button-editor">
      {/* Existing image/audio sections */}

      {/* Label input */}
      <div className="editor-section">
        <label htmlFor="button-label">Text Label</label>
        <div className="label-input-wrapper">
          <input
            id="button-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={50}
            placeholder="Add label (optional)"
          />
          <span className="char-count">{label.length}/50</span>
        </div>
      </div>

      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Step 7: Label Position Setting

Add to `src/components/Editor/LayoutSelector.tsx` or create new component:

```tsx
function LabelPositionSelector({
  value,
  onChange,
}: LabelPositionSelectorProps) {
  const options: { value: LabelPosition; label: string }[] = [
    { value: 'below', label: 'Below image' },
    { value: 'above', label: 'Above image' },
    { value: 'hidden', label: 'Hidden' },
  ];

  return (
    <fieldset className="label-position-selector">
      <legend>Label Position</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="labelPosition"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/button-labels.test.ts
import { isValidLabel, normalizeLabel } from '../src/types';

describe('Label Validation', () => {
  it('should accept null label', () => {
    expect(isValidLabel(null)).toBe(true);
  });

  it('should accept valid label', () => {
    expect(isValidLabel('Water')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(isValidLabel('')).toBe(false);
  });

  it('should reject label over 50 chars', () => {
    expect(isValidLabel('a'.repeat(51))).toBe(false);
  });
});

describe('Label Normalization', () => {
  it('should trim whitespace', () => {
    expect(normalizeLabel('  Water  ')).toBe('Water');
  });

  it('should return null for whitespace-only', () => {
    expect(normalizeLabel('   ')).toBe(null);
  });
});
```

## Verification Checklist

- [ ] Labels display below image by default
- [ ] Labels display above when position is "above"
- [ ] Labels hidden when position is "hidden"
- [ ] Long labels truncate with ellipsis
- [ ] Label input shows character count
- [ ] Labels persist across app restarts
- [ ] Contrast meets WCAG AA (4.5:1)
- [ ] Labels read by screen readers
- [ ] Works in Chrome, Firefox, Safari, Edge
