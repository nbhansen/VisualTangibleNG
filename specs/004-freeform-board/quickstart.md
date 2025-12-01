# Quickstart: Freeform Board Layout

**Feature**: 004-freeform-board
**Prerequisites**: 001-core-comm-board must be complete

## Overview

This feature adds a Miro-like freeform canvas as an alternative to the fixed grid:
1. **Drag positioning** - Move buttons anywhere on the canvas
2. **Free resize** - Make buttons any size (min 44x44px)
3. **Pan/zoom** - Navigate large boards with gestures
4. **Mode switching** - Toggle between grid and freeform

## Implementation Steps

### Step 1: Update Types

Extend `src/types/index.ts`:

```typescript
// Board mode
export type BoardMode = 'grid' | 'freeform';

// Button position (freeform)
export interface ButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

// Extend Button
export interface Button {
  // ... existing fields
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  zIndex: number | null;
}

// Extend Board
export interface Board {
  // ... existing fields
  mode: BoardMode;
  canvasWidth: number;
  canvasHeight: number;
  viewportZoom: number;
  viewportPanX: number;
  viewportPanY: number;
}
```

### Step 2: Database Migration

Update `src/services/storage/db.ts`:

```typescript
const DB_VERSION = 3;

// In upgrade handler:
if (oldVersion < 3) {
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
```

### Step 3: Canvas Hook

Create `src/hooks/useCanvas.ts`:

```typescript
export function useCanvas(initialViewport: Viewport): UseCanvasReturn {
  const [viewport, setViewport] = useState(initialViewport);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setViewport(v => ({
      ...v,
      panX: v.panX + deltaX,
      panY: v.panY + deltaY,
    }));
  }, []);

  const zoomAt = useCallback((factor: number, centerX: number, centerY: number) => {
    setViewport(v => {
      const newZoom = clampZoom(v.zoom * factor);
      const scale = newZoom / v.zoom;

      // Adjust pan to zoom toward center point
      return {
        zoom: newZoom,
        panX: centerX - (centerX - v.panX) * scale,
        panY: centerY - (centerY - v.panY) * scale,
      };
    });
  }, []);

  return { viewport, setViewport, pan, zoomAt, fitToContent, reset };
}
```

### Step 4: Draggable Hook

Create `src/hooks/useDraggable.ts`:

```typescript
export function useDraggable(zoom: number): UseDraggableReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    buttonId: null,
    startX: 0,
    startY: 0,
    originalPosition: null,
  });

  const startDrag = useCallback((
    buttonId: string,
    e: PointerEvent,
    position: ButtonPosition
  ) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      buttonId,
      startX: e.clientX,
      startY: e.clientY,
      originalPosition: position,
    });
  }, []);

  const handleMove = useCallback((e: PointerEvent): ButtonPosition | null => {
    if (!dragState.isDragging || !dragState.originalPosition) return null;

    return calculateDragPosition(
      dragState.originalPosition,
      dragState.startX,
      dragState.startY,
      e.clientX,
      e.clientY,
      zoom
    );
  }, [dragState, zoom]);

  // ... resize handling similar

  return { dragState, resizeState, startDrag, startResize, handleMove, endOperation, cancel };
}
```

### Step 5: Board Canvas Component

Create `src/components/Board/BoardCanvas.tsx`:

```tsx
export function BoardCanvas({
  buttons,
  viewport,
  isEditing,
  onViewportChange,
  onButtonPositionChange,
}: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pan, zoomAt } = useCanvas(viewport);

  // Pointer event handlers for pan/zoom
  const pointersRef = useRef(new Map<number, Point>());

  const handlePointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pointers = pointersRef.current;
    if (!pointers.has(e.pointerId)) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && !isEditing) {
      // Single pointer: pan
      pan(e.movementX, e.movementY);
    } else if (pointers.size === 2) {
      // Two pointers: pinch zoom
      handlePinch(pointers);
    }
  };

  return (
    <div
      ref={containerRef}
      className="board-canvas-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <div
        className="board-canvas"
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {buttons.map(button => (
          <DraggableButton
            key={button.id}
            button={button}
            isEditing={isEditing}
            onPositionChange={pos => onButtonPositionChange(button.id, pos)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Step 6: Draggable Button Component

Create `src/components/Board/DraggableButton.tsx`:

```tsx
export function DraggableButton({
  button,
  isEditing,
  isSelected,
  onPositionChange,
  onSelect,
  onClick,
}: DraggableButtonProps) {
  const [localPos, setLocalPos] = useState(button.position);
  const { startDrag, handleMove, endOperation } = useDraggable(viewport.zoom);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditing) {
      onClick();
      return;
    }

    e.stopPropagation();
    onSelect();
    startDrag(button.id, e.nativeEvent, localPos);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const newPos = handleMove(e.nativeEvent);
    if (newPos) setLocalPos(newPos);
  };

  const handlePointerUp = () => {
    const finalPos = endOperation();
    if (finalPos) onPositionChange(finalPos);
  };

  return (
    <div
      className={`draggable-button ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: localPos.x,
        top: localPos.y,
        width: localPos.width,
        height: localPos.height,
        zIndex: localPos.zIndex,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <BoardButton button={button} />

      {/* Resize handles (edit mode only) */}
      {isEditing && isSelected && (
        <>
          <div className="resize-handle nw" onPointerDown={e => startResize('nw', e)} />
          <div className="resize-handle ne" onPointerDown={e => startResize('ne', e)} />
          <div className="resize-handle sw" onPointerDown={e => startResize('sw', e)} />
          <div className="resize-handle se" onPointerDown={e => startResize('se', e)} />
        </>
      )}
    </div>
  );
}
```

### Step 7: Mode Selector

Create `src/components/Editor/ModeSelector.tsx`:

```tsx
export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <fieldset className="mode-selector">
      <legend>Layout Mode</legend>
      <label>
        <input
          type="radio"
          name="mode"
          value="grid"
          checked={value === 'grid'}
          onChange={() => onChange('grid')}
        />
        Grid
      </label>
      <label>
        <input
          type="radio"
          name="mode"
          value="freeform"
          checked={value === 'freeform'}
          onChange={() => onChange('freeform')}
        />
        Freeform
      </label>
    </fieldset>
  );
}
```

### Step 8: CSS Styles

Create `src/components/Board/BoardCanvas.css`:

```css
.board-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
  background: var(--canvas-bg, #f5f5f5);
}

.board-canvas {
  position: absolute;
  will-change: transform;
}

.draggable-button {
  position: absolute;
  cursor: grab;
  user-select: none;
}

.draggable-button:active {
  cursor: grabbing;
}

.draggable-button.selected {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border: 2px solid white;
  border-radius: 2px;
}

.resize-handle.nw { top: -6px; left: -6px; cursor: nwse-resize; }
.resize-handle.ne { top: -6px; right: -6px; cursor: nesw-resize; }
.resize-handle.sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
.resize-handle.se { bottom: -6px; right: -6px; cursor: nwse-resize; }
```

## Testing

### Unit Tests

```typescript
// tests/unit/canvas-math.test.ts
describe('Coordinate transforms', () => {
  it('should convert world to screen coords', () => {
    const viewport = { zoom: 2, panX: 100, panY: 50 };
    const result = worldToScreen({ x: 10, y: 20 }, viewport);
    expect(result).toEqual({ x: 120, y: 90 });
  });
});

// tests/unit/position-bounds.test.ts
describe('Position validation', () => {
  it('should enforce minimum size', () => {
    const pos = clampPosition({ x: 0, y: 0, width: 20, height: 20, zIndex: 0 }, 1920, 1080);
    expect(pos.width).toBe(44);
    expect(pos.height).toBe(44);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/freeform-drag.spec.ts
test('drag button to new position', async ({ page }) => {
  await page.goto('/');
  await enterEditMode(page);
  await switchToFreeform(page);

  const button = page.locator('.draggable-button').first();
  const box = await button.boundingBox();

  await button.dragTo(page.locator('.board-canvas'), {
    targetPosition: { x: box.x + 200, y: box.y + 100 }
  });

  // Verify position changed
  const newBox = await button.boundingBox();
  expect(newBox.x).toBeGreaterThan(box.x + 150);
});
```

## Verification Checklist

- [ ] Buttons can be dragged in edit mode
- [ ] Buttons can be resized with corner handles
- [ ] Minimum size (44x44) enforced
- [ ] Pan gesture works (two-finger drag or middle mouse)
- [ ] Pinch-to-zoom works
- [ ] Grid ↔ Freeform switching preserves content
- [ ] Positions persist after reload
- [ ] Buttons remain accessible (keyboard navigation)
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] 60fps during drag/pan/zoom
