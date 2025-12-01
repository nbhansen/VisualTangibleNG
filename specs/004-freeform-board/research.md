# Research: Freeform Board Layout

**Feature**: 004-freeform-board
**Date**: 2025-12-01

## Technology Decisions

### 1. Gesture Library: Vanilla Pointer Events (No Library)

**Decision**: Implement drag/pan/zoom with native Pointer Events API, no external library.

**Rationale**:
- Pointer Events provide unified touch/mouse/pen handling
- Avoids adding dependency (constitution principle VI)
- Our use case is simpler than general gesture libraries target
- Full control over behavior, easier to debug
- ~200 lines of custom code vs ~50KB library

**Alternatives Considered**:
- @use-gesture/react (~30KB): Powerful but overkill, adds dependency
- react-draggable: Only handles drag, not pan/zoom
- hammer.js: Older, larger bundle, not React-native
- interact.js: Full featured but heavy

**Implementation Notes**:
```typescript
// Pointer Events API provides:
// - onPointerDown, onPointerMove, onPointerUp
// - pointerId for multi-touch tracking
// - pointerType for input differentiation
// - Unified API across touch/mouse/pen

interface PointerState {
  pointers: Map<number, { x: number; y: number }>;
  isDragging: boolean;
  isPanning: boolean;
  startDistance?: number;
  startScale?: number;
}
```

### 2. Canvas Implementation: CSS Transform on Container

**Decision**: Use CSS `transform: translate() scale()` on a container div for pan/zoom.

**Rationale**:
- GPU-accelerated transforms for smooth 60fps
- Simple coordinate math for world ↔ screen conversion
- No canvas element needed (maintains DOM accessibility)
- Buttons remain native DOM elements (clickable, focusable)

**Alternatives Considered**:
- HTML Canvas: Loses DOM accessibility, must reimplement hit testing
- SVG: More complex for mixed content
- Individual transforms per button: Complex, poor performance at scale

**Implementation Notes**:
```tsx
<div
  className="canvas-viewport"
  style={{
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: '0 0',
  }}
>
  {buttons.map(btn => (
    <DraggableButton
      key={btn.id}
      style={{ left: btn.x, top: btn.y, width: btn.width, height: btn.height }}
    />
  ))}
</div>
```

### 3. Coordinate System: World Coordinates with Viewport Transform

**Decision**: Store positions in "world" coordinates, apply viewport transform for display.

**Rationale**:
- Button positions independent of current zoom/pan
- Export data is zoom-independent
- Simple math for world ↔ screen conversion
- Standard approach used by all canvas tools (Figma, Miro, etc.)

**Alternatives Considered**:
- Screen coordinates: Would need recalculation on every zoom
- Percentage-based: Poor precision, zoom complexity

**Implementation Notes**:
```typescript
// World → Screen
function worldToScreen(worldX: number, worldY: number, viewport: Viewport) {
  return {
    screenX: worldX * viewport.zoom + viewport.panX,
    screenY: worldY * viewport.zoom + viewport.panY,
  };
}

// Screen → World (for placing dropped items)
function screenToWorld(screenX: number, screenY: number, viewport: Viewport) {
  return {
    worldX: (screenX - viewport.panX) / viewport.zoom,
    worldY: (screenY - viewport.panY) / viewport.zoom,
  };
}
```

### 4. Pinch-to-Zoom: Two-Pointer Distance Tracking

**Decision**: Track distance between two pointers, scale zoom proportionally.

**Rationale**:
- Standard pinch gesture users expect
- Pointer Events makes multi-touch easy
- Zoom centered on pinch midpoint for natural feel

**Alternatives Considered**:
- Mouse wheel only: Poor touch experience
- Zoom buttons only: Less intuitive

**Implementation Notes**:
```typescript
function handlePinch(pointers: Map<number, Point>) {
  if (pointers.size !== 2) return;

  const [p1, p2] = [...pointers.values()];
  const currentDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  if (startDistance === null) {
    startDistance = currentDistance;
    startZoom = zoom;
    return;
  }

  const scale = currentDistance / startDistance;
  const newZoom = Math.max(0.5, Math.min(2, startZoom * scale));

  // Zoom toward pinch center
  const centerX = (p1.x + p2.x) / 2;
  const centerY = (p1.y + p2.y) / 2;
  // ... adjust pan to keep center stable
}
```

### 5. Drag Handling: Pointer Capture for Reliable Tracking

**Decision**: Use `setPointerCapture()` during drag for reliable tracking outside element bounds.

**Rationale**:
- Pointer capture ensures moves tracked even if cursor leaves element
- Standard approach for drag operations
- Works across all pointer types

**Alternatives Considered**:
- Document-level listeners: More complex cleanup
- CSS `touch-action: none`: Only part of solution

**Implementation Notes**:
```typescript
function handlePointerDown(e: React.PointerEvent) {
  e.currentTarget.setPointerCapture(e.pointerId);
  setDragStart({ x: e.clientX, y: e.clientY });
}

function handlePointerUp(e: React.PointerEvent) {
  e.currentTarget.releasePointerCapture(e.pointerId);
  setDragStart(null);
}
```

### 6. Resize Handles: Corner Handles with Proportional Scaling

**Decision**: Four corner handles, drag to resize proportionally.

**Rationale**:
- Simple UI, clear affordance
- Proportional resize maintains button aspect ratio
- Minimum size enforced (44x44px)

**Alternatives Considered**:
- Edge handles: More complex, usually not needed
- Free resize: Can distort images badly
- Size presets: Less flexible

**Implementation Notes**:
```tsx
// Resize handle positions
const handles = ['nw', 'ne', 'sw', 'se'] as const;

function ResizeHandle({ position, onResize }) {
  return (
    <div
      className={`resize-handle resize-handle-${position}`}
      onPointerDown={(e) => {
        e.stopPropagation();
        startResize(position, e);
      }}
    />
  );
}
```

### 7. Z-Index Management: Bring to Front on Interaction

**Decision**: Track zIndex per button, increment max on each interaction.

**Rationale**:
- Most recently touched button always on top
- Simple counter approach
- Persisted for consistent reload

**Alternatives Considered**:
- Fixed layers: Too restrictive
- Manual z-ordering: Complex UI needed
- DOM order: Breaks with positioning

**Implementation Notes**:
```typescript
let maxZIndex = 0;

function bringToFront(buttonId: string) {
  maxZIndex += 1;
  updateButtonZIndex(buttonId, maxZIndex);
}
```

### 8. Mode Switching: Position Calculation on Transition

**Decision**: Calculate absolute positions from grid when switching to freeform, snap to grid positions when switching back.

**Rationale**:
- Seamless transition preserves spatial arrangement
- Grid → Freeform: Positions based on grid cell coordinates
- Freeform → Grid: Assign positions by spatial order (top-left to bottom-right)

**Alternatives Considered**:
- Reset positions on switch: Loses user arrangement
- Keep both layouts: Complex data model

**Implementation Notes**:
```typescript
function gridToFreeform(buttons: Button[], gridLayout: GridLayout) {
  const cellWidth = CANVAS_WIDTH / GRID_ARRANGEMENTS[gridLayout][1];
  const cellHeight = CANVAS_HEIGHT / GRID_ARRANGEMENTS[gridLayout][0];

  return buttons.map(btn => ({
    ...btn,
    x: (btn.position % cols) * cellWidth,
    y: Math.floor(btn.position / cols) * cellHeight,
    width: cellWidth - GAP,
    height: cellHeight - GAP,
  }));
}
```

### 9. Accessibility: Spatial Order Scan

**Decision**: For switch scanning, order buttons by position (top-left to bottom-right).

**Rationale**:
- Predictable scan order based on visual layout
- Matches reading order expectations
- Recalculated whenever positions change

**Alternatives Considered**:
- Creation order: Not intuitive visually
- Manual order: Too complex for caregivers
- Tab index: Same as position order

**Implementation Notes**:
```typescript
function getScanOrder(buttons: ButtonWithPosition[]): Button[] {
  return [...buttons].sort((a, b) => {
    const rowA = Math.floor(a.y / ROW_THRESHOLD);
    const rowB = Math.floor(b.y / ROW_THRESHOLD);
    if (rowA !== rowB) return rowA - rowB;
    return a.x - b.x;
  });
}
```

### 10. Performance: Debounced Persistence

**Decision**: Debounce position updates to IndexedDB, immediate visual feedback.

**Rationale**:
- Visual feedback must be instant (60fps)
- Storage writes can be batched (every 500ms while dragging)
- Final position saved on drag end

**Alternatives Considered**:
- Immediate persistence: Too many writes, lag risk
- Only on drag end: Risk of data loss on crash

**Implementation Notes**:
```typescript
const debouncedSave = useMemo(
  () => debounce((btn) => storageService.updateButtonPosition(btn), 500),
  []
);

function handleDrag(newX: number, newY: number) {
  setLocalPosition({ x: newX, y: newY }); // Immediate
  debouncedSave({ ...button, x: newX, y: newY }); // Debounced
}

function handleDragEnd() {
  debouncedSave.flush(); // Ensure final save
}
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Pointer Events | Yes | Yes | 13+ | Yes |
| setPointerCapture | Yes | Yes | 13+ | Yes |
| CSS transform | Yes | Yes | Yes | Yes |
| touch-action CSS | Yes | Yes | Yes | Yes |

All features fully supported in target browsers (latest 2 versions).

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Drag FPS | 60fps | Chrome DevTools |
| Pan/Zoom FPS | 60fps | Chrome DevTools |
| Position update latency | <16ms | Profiler |
| Time to first interaction | <100ms | Manual |
| Max buttons at 60fps | 50+ | Stress test |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Touch conflict with scroll | Page scrolls instead of pans | `touch-action: none` on canvas |
| Performance with many buttons | Jank during pan/zoom | Virtual rendering if >50 buttons |
| Safari pointer event quirks | Drag breaks on iOS | Test extensively, add workarounds |
| Accessibility regression | Switch users can't navigate | Maintain tab order, test with screen reader |

## Open Questions (Resolved)

All technical questions resolved. Ready for Phase 1 design.
