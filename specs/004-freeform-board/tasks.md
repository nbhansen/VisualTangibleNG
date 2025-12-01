# Tasks: Freeform Board Layout

**Input**: Design documents from `/specs/004-freeform-board/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/
**Depends On**: 001-core-comm-board (must be complete)

**Tests**: Not explicitly requested - minimal test tasks included for critical functionality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow structure from plan.md

---

## Phase 1: Setup

**Purpose**: Copy contracts and prepare types

- [ ] T001 Copy BoardMode type ('grid' | 'freeform') from contracts/canvas.ts to src/types/index.ts
- [ ] T002 [P] Copy Viewport interface from contracts/canvas.ts to src/types/index.ts
- [ ] T003 [P] Copy CanvasConfig interface from contracts/canvas.ts to src/types/index.ts
- [ ] T004 [P] Copy ZOOM_CONSTRAINTS constant from contracts/canvas.ts to src/types/index.ts
- [ ] T005 [P] Copy ButtonPosition interface from contracts/positioning.ts to src/types/index.ts
- [ ] T006 [P] Copy SIZE_CONSTRAINTS constant from contracts/positioning.ts to src/types/index.ts
- [ ] T007 [P] Copy Point and Bounds interfaces from contracts/canvas.ts to src/types/index.ts

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Type Extensions

- [ ] T008 Add x, y, width, height, zIndex fields (number | null) to Button interface in src/types/index.ts
- [ ] T009 Add mode field (BoardMode) to Board interface in src/types/index.ts
- [ ] T010 Add canvasWidth, canvasHeight fields (number) to Board interface in src/types/index.ts
- [ ] T011 Add viewportZoom, viewportPanX, viewportPanY fields (number) to Board interface in src/types/index.ts

### Database Migration

- [ ] T012 Increment DB_VERSION from 2 to 3 in src/services/storage/db.ts
- [ ] T013 Add migration logic for v2→v3 to set default mode='grid' on existing boards in db.ts
- [ ] T014 Add migration logic to set canvasWidth=1920, canvasHeight=1080 defaults in db.ts
- [ ] T015 Add migration logic to set viewportZoom=1, viewportPanX=0, viewportPanY=0 defaults in db.ts

### Storage Methods

- [ ] T016 Implement updateButtonPosition(buttonId, position) method in src/services/storage/StorageService.ts
- [ ] T017 [P] Implement updateButtonZIndex(buttonId, zIndex) method in StorageService.ts
- [ ] T018 [P] Implement updateBoardMode(boardId, mode) method in StorageService.ts
- [ ] T019 [P] Implement updateBoardViewport(boardId, viewport) method in StorageService.ts
- [ ] T020 Implement batchUpdateButtonPositions(updates) method in StorageService.ts

### Core Utility Functions

- [ ] T021 Copy worldToScreen function from contracts/canvas.ts to src/utils/canvas.ts
- [ ] T022 [P] Copy screenToWorld function from contracts/canvas.ts to src/utils/canvas.ts
- [ ] T023 [P] Copy clampZoom function from contracts/canvas.ts to src/utils/canvas.ts
- [ ] T024 [P] Copy clampPosition function from contracts/positioning.ts to src/utils/canvas.ts
- [ ] T025 [P] Copy calculateDragPosition function from contracts/positioning.ts to src/utils/canvas.ts
- [ ] T026 [P] Copy calculateResizeBounds function from contracts/positioning.ts to src/utils/canvas.ts
- [ ] T027 [P] Copy sortByPosition function from contracts/positioning.ts to src/utils/canvas.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Drag Buttons to Any Position (Priority: P1)

**Goal**: Allow buttons to be dragged to any X,Y position on the canvas in edit mode

**Independent Test**: Enter edit mode on a freeform board, drag a button from one location to another. Exit edit mode and verify button stays in new position after reload.

### Implementation for User Story 1

- [ ] T028 [US1] Create useDraggable hook with dragState management in src/hooks/useDraggable.ts
- [ ] T029 [US1] Implement startDrag function in useDraggable.ts
- [ ] T030 [US1] Implement handleMove function returning new ButtonPosition in useDraggable.ts
- [ ] T031 [US1] Implement endOperation function with final position save in useDraggable.ts
- [ ] T032 [US1] Add pointer capture on drag start in useDraggable.ts
- [ ] T033 [US1] Create DraggableButton component in src/components/Board/DraggableButton.tsx
- [ ] T034 [US1] Add absolute positioning via style prop in DraggableButton.tsx
- [ ] T035 [US1] Wire onPointerDown/Move/Up to useDraggable in DraggableButton.tsx
- [ ] T036 [US1] Pass zoom factor from canvas context to drag calculations in DraggableButton.tsx
- [ ] T037 [US1] Call storageService.updateButtonPosition on drop in DraggableButton.tsx
- [ ] T038 [P] [US1] Create DraggableButton.css with .draggable-button base styles
- [ ] T039 [P] [US1] Add cursor: grab and cursor: grabbing states in DraggableButton.css
- [ ] T040 [US1] Create BoardCanvas component shell in src/components/Board/BoardCanvas.tsx
- [ ] T041 [US1] Render DraggableButton for each button with position data in BoardCanvas.tsx
- [ ] T042 [P] [US1] Create BoardCanvas.css with container and canvas styles
- [ ] T043 [US1] Modify Board.tsx to conditionally render BoardCanvas when mode='freeform'
- [ ] T044 [US1] Update z-index on button drop (bring to front) via updateButtonZIndex in DraggableButton.tsx

**Checkpoint**: User Story 1 complete - buttons can be dragged and persist position

---

## Phase 4: User Story 2 - Resize Buttons Freely (Priority: P1)

**Goal**: Allow buttons to be resized via corner handles with minimum 44x44px constraint

**Independent Test**: Select a button in edit mode, drag a corner resize handle. Verify the button displays at the new size in view mode and persists after reload.

### Implementation for User Story 2

- [ ] T045 [US2] Add resizeState management to useDraggable hook in src/hooks/useDraggable.ts
- [ ] T046 [US2] Implement startResize function with handle parameter in useDraggable.ts
- [ ] T047 [US2] Update handleMove to handle resize operations in useDraggable.ts
- [ ] T048 [US2] Enforce SIZE_CONSTRAINTS.MIN_WIDTH/MIN_HEIGHT during resize in useDraggable.ts
- [ ] T049 [US2] Add resize handle elements (nw, ne, sw, se) to DraggableButton.tsx
- [ ] T050 [US2] Wire resize handles to startResize in DraggableButton.tsx
- [ ] T051 [US2] Show resize handles only when button is selected and isEditing in DraggableButton.tsx
- [ ] T052 [P] [US2] Add .resize-handle CSS styles with position and cursor in DraggableButton.css
- [ ] T053 [P] [US2] Add .selected state styling (outline) in DraggableButton.css
- [ ] T054 [US2] Add selectedButtonId state to BoardCanvas.tsx
- [ ] T055 [US2] Pass isSelected prop to DraggableButton based on selectedButtonId in BoardCanvas.tsx
- [ ] T056 [US2] Update position with new width/height on resize end in DraggableButton.tsx

**Checkpoint**: User Story 2 complete - buttons can be resized with constraints

---

## Phase 5: User Story 3 - Pan and Zoom Canvas (Priority: P2)

**Goal**: Navigate large boards via pan gesture and pinch-to-zoom with 50%-200% range

**Independent Test**: On a board with buttons spread across a large canvas, pinch-to-zoom and two-finger-drag to pan. Verify buttons scale with zoom and panning reveals off-screen buttons.

### Implementation for User Story 3

- [ ] T057 [US3] Create useCanvas hook with viewport state in src/hooks/useCanvas.ts
- [ ] T058 [US3] Implement pan(deltaX, deltaY) function in useCanvas.ts
- [ ] T059 [US3] Implement zoomAt(factor, centerX, centerY) function in useCanvas.ts
- [ ] T060 [US3] Implement fitToContent() using calculateFitZoom in useCanvas.ts
- [ ] T061 [US3] Implement reset() to return to default viewport in useCanvas.ts
- [ ] T062 [US3] Add multi-pointer tracking (Map of pointerId → position) to BoardCanvas.tsx
- [ ] T063 [US3] Detect single-pointer drag for pan (when not on button) in BoardCanvas.tsx
- [ ] T064 [US3] Detect two-pointer pinch and calculate zoom factor in BoardCanvas.tsx
- [ ] T065 [US3] Apply CSS transform: translate + scale to canvas inner div in BoardCanvas.tsx
- [ ] T066 [US3] Set touch-action: none on canvas container in BoardCanvas.css
- [ ] T067 [US3] Persist viewport to storage via updateBoardViewport on change in BoardCanvas.tsx
- [ ] T068 [US3] Load initial viewport from board data in BoardCanvas.tsx
- [ ] T069 [P] [US3] Add "Fit All" button that calls fitToContent in BoardCanvas.tsx or EditMode.tsx
- [ ] T070 [P] [US3] Style "Fit All" button in BoardCanvas.css or Editor.css

**Checkpoint**: User Story 3 complete - canvas supports pan and zoom navigation

---

## Phase 6: User Story 4 - Switch Between Grid and Freeform Modes (Priority: P2)

**Goal**: Toggle board mode with automatic position conversion in both directions

**Independent Test**: Create a 4-button grid board. Switch to freeform mode. Verify buttons appear at grid-like positions. Move one button. Switch back to grid. Verify buttons are re-ordered by position.

### Implementation for User Story 4

- [ ] T071 [US4] Create ModeSelector component with radio inputs in src/components/Editor/ModeSelector.tsx
- [ ] T072 [P] [US4] Add CSS styling for ModeSelector in src/components/Editor/Editor.css
- [ ] T073 [US4] Add ModeSelector to EditMode settings section in src/components/EditMode.tsx
- [ ] T074 [US4] Implement gridToFreeformPositions(buttons, layout) in src/utils/canvas.ts
- [ ] T075 [US4] Implement freeformToGridPositions(buttons) using sortByPosition in src/utils/canvas.ts
- [ ] T076 [US4] Call gridToFreeformPositions when switching grid→freeform in EditMode.tsx
- [ ] T077 [US4] Call freeformToGridPositions when switching freeform→grid in EditMode.tsx
- [ ] T078 [US4] Call batchUpdateButtonPositions for grid→freeform transition in EditMode.tsx
- [ ] T079 [US4] Update button.position field for freeform→grid transition in EditMode.tsx
- [ ] T080 [US4] Call updateBoardMode after position conversion in EditMode.tsx
- [ ] T081 [US4] Refresh board display after mode change to show updated layout

**Checkpoint**: User Story 4 complete - seamless mode switching with position conversion

---

## Phase 7: User Story 5 - Add New Buttons Anywhere (Priority: P2)

**Goal**: Create new buttons at tap location in freeform mode

**Independent Test**: In freeform edit mode, tap on empty canvas area. Verify new empty button appears at that location with default size.

### Implementation for User Story 5

- [ ] T082 [US5] Add onCanvasTap handler to BoardCanvas.tsx
- [ ] T083 [US5] Convert tap screen position to world coordinates in BoardCanvas.tsx
- [ ] T084 [US5] Check if tap is on empty space (not on existing button) in BoardCanvas.tsx
- [ ] T085 [US5] Create new button with calculated position and DEFAULT_WIDTH/HEIGHT in BoardCanvas.tsx
- [ ] T086 [US5] Assign zIndex as max existing zIndex + 1 for new buttons in BoardCanvas.tsx
- [ ] T087 [US5] Call storageService to create button with position fields in BoardCanvas.tsx
- [ ] T088 [US5] Check MAX_BUTTONS (50) limit before creating in BoardCanvas.tsx
- [ ] T089 [US5] Show toast/message when button limit reached in BoardCanvas.tsx

**Checkpoint**: User Story 5 complete - new buttons can be added at any location

---

## Phase 8: Polish & Edge Cases

**Purpose**: Final polish and edge case handling

### Accessibility

- [ ] T090 [P] Implement sortByPosition for keyboard navigation order in BoardCanvas.tsx
- [ ] T091 [P] Add tabIndex based on position order to DraggableButton in BoardCanvas.tsx
- [ ] T092 Ensure minimum touch target (44x44) is maintained at all zoom levels in BoardCanvas.tsx

### Backwards Compatibility

- [ ] T093 Handle undefined position fields as grid mode in Board.tsx
- [ ] T094 Handle undefined x/y/width/height on buttons as null in BoardButton.tsx

### Performance

- [ ] T095 [P] Add will-change: transform to canvas for GPU acceleration in BoardCanvas.css
- [ ] T096 [P] Debounce viewport persistence saves (500ms) in BoardCanvas.tsx

### View Mode Behavior

- [ ] T097 Ensure drag is disabled in view mode (only edit mode) in DraggableButton.tsx
- [ ] T098 Ensure tap plays audio in view mode (no drag) in DraggableButton.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - can start after Phase 2
- **US2 (Phase 4)**: Depends on US1 (extends useDraggable, DraggableButton)
- **US3 (Phase 5)**: Depends on Foundational - can run parallel with US1/US2
- **US4 (Phase 6)**: Depends on Foundational - can run parallel with US1/US2/US3
- **US5 (Phase 7)**: Depends on US1 (needs BoardCanvas), can start after US1
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```text
Phase 2 (Foundation)
    │
    ├───────────────────┬───────────────────┐
    ▼                   ▼                   ▼
Phase 3 (US1)       Phase 5 (US3)       Phase 6 (US4)
    │                   │                   │
    ▼                   │                   │
Phase 4 (US2)           │                   │
    │                   │                   │
    ▼                   │                   │
Phase 7 (US5)           │                   │
    │                   │                   │
    └───────────────────┴───────────────────┘
                        │
                        ▼
                Phase 8 (Polish)
```

### Parallel Opportunities

```bash
# Phase 1 Setup:
T002, T003, T004, T005, T006, T007 in parallel

# Phase 2 Foundational - types sequential, then parallel:
T008 → T009 → T010 → T011
T012 → T013, T014, T015 sequential
T016 → T017, T018, T019 in parallel → T020
T021 → T022, T023, T024, T025, T026, T027 in parallel

# Phase 3 US1:
T038, T039, T042 in parallel (CSS files)
T028 → T029 → T030 → T031 → T032
T033 → T034 → T035 → T036 → T037 → T044
T040 → T041 → T043

# Phase 4 US2:
T052, T053 in parallel (CSS)
T045 → T046 → T047 → T048
T049 → T050 → T051 → T056
T054 → T055

# Phase 5 US3:
T069, T070 in parallel
T057 → T058 → T059 → T060 → T061
T062 → T063 → T064 → T065 → T066 → T067 → T068

# Phase 6 US4:
T072 in parallel with T071
T071 → T073 → T074 → T075 → T076 → T077 → T078 → T079 → T080 → T081

# Phase 7 US5:
T082 → T083 → T084 → T085 → T086 → T087 → T088 → T089

# Phase 8 Polish:
T090, T091, T095, T096 in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Drag)
4. Complete Phase 4: User Story 2 (Resize)
5. **STOP and VALIDATE**: Buttons can be dragged and resized in freeform mode
6. Can demo basic freeform layout

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (schema migration)
2. Phase 3 (US1) → Drag positioning → **First freeform demo**
3. Phase 4 (US2) → Resize capability → **Complete button manipulation**
4. Phase 5 (US3) → Pan/Zoom → **Navigate large boards**
5. Phase 6 (US4) → Mode switching → **Grid ↔ Freeform**
6. Phase 7 (US5) → Add anywhere → **Complete freeform editing**
7. Phase 8 → Polish → **Production ready**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 are both P1 priority - implement together for complete manipulation
- Schema migration (v2→v3) required for persistent storage
- Performance critical: drag/pan/zoom must maintain 60fps
- Pointer Events API used (not touch events) for unified handling
- Total: 98 tasks (7 setup, 20 foundational, 17 US1, 12 US2, 14 US3, 11 US4, 8 US5, 9 polish)
