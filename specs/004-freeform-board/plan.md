# Implementation Plan: Freeform Board Layout

**Branch**: `004-freeform-board` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-freeform-board/spec.md`
**Depends On**: 001-core-comm-board (must be complete)

## Summary

Add freeform canvas layout as alternative to fixed grid. Buttons can be dragged to any position, resized freely, and the canvas supports pan/zoom navigation. Includes mode switching between grid and freeform, preserving all button content during transitions. Enables Miro-like spatial organization for complex communication boards.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (existing from 001-core-comm-board)
**Primary Dependencies**: Existing + potentially @use-gesture/react for touch handling
**Storage**: IndexedDB - extends Button (x, y, width, height, zIndex) and Board (mode, viewport)
**Testing**: Vitest (unit), Playwright (E2E for drag/zoom interactions)
**Target Platform**: PWA - Chrome, Firefox, Safari, Edge (latest 2 versions)
**Project Type**: Single project (extends existing)
**Performance Goals**: 60fps drag/pan/zoom, no jank with 50 buttons
**Constraints**: Min 44x44px buttons, touch + mouse support, accessible scan order
**Scale/Scope**: New canvas component, significant changes to Board, ButtonEditor, storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Offline-First PWA | PASS | All state in IndexedDB, no network |
| II. Local Data Ownership | PASS | Positions exportable with board data |
| III. Accessibility-First | PASS | Scan order by position, min touch targets |
| IV. Zero-Friction Editing | PASS | Direct manipulation, drag to position |
| V. Privacy & Child Safety | PASS | No data transmission |
| VI. Open Source | CAUTION | @use-gesture adds dependency - evaluate |
| VII. Pluggable AI | N/A | No AI features |

## Project Structure

### Documentation (this feature)

```text
specs/004-freeform-board/
├── plan.md              # This file
├── research.md          # Canvas/gesture library research
├── data-model.md        # Extended entities with position fields
├── quickstart.md        # Implementation guide
└── contracts/           # TypeScript interfaces
    ├── canvas.ts        # Canvas and viewport types
    └── positioning.ts   # Button position types
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Board/
│   │   ├── Board.tsx            # MODIFY: Conditional grid vs canvas
│   │   ├── BoardCanvas.tsx      # NEW: Freeform canvas container
│   │   ├── BoardCanvas.css      # NEW: Canvas styles
│   │   ├── DraggableButton.tsx  # NEW: Draggable/resizable button
│   │   └── BoardButton.tsx      # MODIFY: Accept absolute positioning
│   └── Editor/
│       ├── EditMode.tsx         # MODIFY: Mode toggle, canvas editing
│       └── ModeSelector.tsx     # NEW: Grid/freeform toggle
├── hooks/
│   ├── useCanvas.ts             # NEW: Pan/zoom state management
│   └── useDraggable.ts          # NEW: Drag/resize logic
├── services/
│   └── storage/
│       ├── db.ts                # MODIFY: Schema v3 migration
│       └── StorageService.ts    # MODIFY: Position CRUD
└── types/
    └── index.ts                 # MODIFY: Add position types

tests/
├── unit/
│   ├── canvas-math.test.ts      # NEW: Coordinate transforms
│   └── position-bounds.test.ts  # NEW: Boundary validation
└── e2e/
    └── freeform-drag.spec.ts    # NEW: Drag interaction tests
```

**Structure Decision**: Extends existing structure with new canvas components. BoardCanvas is separate from Board to isolate complexity.

## Complexity Tracking

| Potential Violation | Justification | Alternative Considered |
|---------------------|---------------|------------------------|
| @use-gesture dependency | Touch gesture handling is complex, battle-tested library avoids bugs | Vanilla JS: high bug risk, significant dev time |

Decision pending research - may implement with vanilla pointer events if gesture complexity is manageable.
