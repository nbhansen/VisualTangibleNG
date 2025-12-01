# Feature Specification: Freeform Board Layout

**Feature Branch**: `004-freeform-board`
**Created**: 2025-12-01
**Status**: Draft
**Input**: User description: "Open-ended freeform board like Miro - drag-and-drop button positioning, zoom/pan, free-form layout instead of fixed grid"
**Depends On**: 001-core-comm-board (must be complete)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag Buttons to Any Position (Priority: P1)

A caregiver drags communication buttons to any position on the board canvas, arranging them in a way that makes sense for their child's needs (e.g., grouping related concepts, creating visual scenes, matching physical layouts).

**Why this priority**: Core differentiator from grid mode - free positioning is the fundamental value proposition of this feature.

**Independent Test**: Enter edit mode, drag a button from one location to another. Exit edit mode and verify button stays in new position.

**Acceptance Scenarios**:

1. **Given** user is in edit mode, **When** they drag a button, **Then** the button moves smoothly following the touch/cursor
2. **Given** a button is dragged to a new position, **When** the user releases, **Then** the button snaps to that position and is persisted
3. **Given** two buttons overlap, **When** viewing the board, **Then** the most recently moved button appears on top
4. **Given** a button is dragged near the edge, **When** released, **Then** the button stays fully within the visible canvas

---

### User Story 2 - Resize Buttons Freely (Priority: P1)

A caregiver resizes buttons to different sizes, making important or frequently-used buttons larger and less common ones smaller.

**Why this priority**: Essential complement to positioning - size variation enables visual hierarchy and emphasis.

**Independent Test**: Select a button in edit mode, resize it larger. Verify the button displays at the new size in view mode.

**Acceptance Scenarios**:

1. **Given** user selects a button in edit mode, **When** they drag a resize handle, **Then** the button resizes proportionally
2. **Given** a button is resized, **When** user exits edit mode, **Then** the new size is preserved
3. **Given** a button is made very small, **When** the resize reaches minimum size (44x44px), **Then** it stops shrinking
4. **Given** a button is made very large, **When** it would exceed canvas bounds, **Then** it stops growing

---

### User Story 3 - Pan and Zoom Canvas (Priority: P2)

A caregiver or child navigates a large board by panning (scrolling) and zooming in/out. This allows boards with many buttons spread across a large virtual space.

**Why this priority**: Enables larger, more complex boards but basic freeform works without it.

**Independent Test**: Pinch-to-zoom on a board with buttons. Verify buttons scale with the zoom. Pan to see off-screen buttons.

**Acceptance Scenarios**:

1. **Given** the board has buttons beyond the visible area, **When** user drags with two fingers (or middle mouse), **Then** the canvas pans smoothly
2. **Given** user pinches to zoom out, **When** viewing the board, **Then** all buttons appear smaller and more fit on screen
3. **Given** user pinches to zoom in, **When** viewing a button, **Then** the button and its image appear larger
4. **Given** zoom is at minimum (fit-all), **When** user tries to zoom out further, **Then** zoom stops at minimum level
5. **Given** zoom is at maximum (200%), **When** user tries to zoom in further, **Then** zoom stops at maximum level

---

### User Story 4 - Switch Between Grid and Freeform Modes (Priority: P2)

A caregiver can switch a board between traditional grid mode and freeform mode. When switching to freeform, buttons are initially placed in their grid positions. When switching to grid, buttons snap to nearest grid positions.

**Why this priority**: Allows users to start with familiar grid and gradually adopt freeform, or use grid for simple boards.

**Independent Test**: Create a 4-button grid board. Switch to freeform mode. Verify buttons appear in approximate 2x2 positions. Move one button. Switch back to grid. Verify all buttons snap to grid.

**Acceptance Scenarios**:

1. **Given** a board is in grid mode, **When** user switches to freeform, **Then** buttons are placed at positions matching their grid locations
2. **Given** a board is in freeform mode, **When** user switches to grid, **Then** buttons snap to nearest available grid positions
3. **Given** user is in edit mode, **When** they view settings, **Then** they see toggle for grid/freeform mode
4. **Given** board mode is changed, **When** persisted, **Then** the mode preference is saved with the board

---

### User Story 5 - Add New Buttons Anywhere (Priority: P2)

A caregiver adds new buttons at any location by tapping/clicking on empty space, rather than being limited to predefined grid slots.

**Why this priority**: Natural extension of freeform positioning - new buttons shouldn't be constrained either.

**Independent Test**: In freeform edit mode, tap on empty canvas area. Verify new empty button appears at that location.

**Acceptance Scenarios**:

1. **Given** user is in freeform edit mode, **When** they tap empty space, **Then** a new button is created at that location
2. **Given** user taps near existing button, **When** new button is created, **Then** it doesn't overlap with existing buttons
3. **Given** maximum buttons reached (e.g., 50), **When** user tries to add more, **Then** they see a message about the limit

---

### Edge Cases

- What happens when loading a freeform board on a smaller screen? Buttons maintain relative positions but may require panning.
- What happens if buttons are positioned off-screen and user can't find them? Provide "fit all" zoom option to see all buttons.
- What happens with accessibility (switch scanning) in freeform mode? Buttons are scanned in reading order (top-left to bottom-right by position).
- What happens when importing a grid board into freeform? Buttons get absolute positions based on their grid cell locations.
- What happens with very many buttons (30+)? Performance may degrade; test and set reasonable limits.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow buttons to be positioned at any X,Y coordinate on the canvas
- **FR-002**: System MUST allow buttons to be resized freely (minimum 44x44px, maximum canvas bounds)
- **FR-003**: System MUST support pan gesture to navigate the canvas
- **FR-004**: System MUST support pinch-to-zoom (50% to 200% range)
- **FR-005**: System MUST persist button positions and sizes to IndexedDB
- **FR-006**: System MUST provide mode toggle between grid and freeform layouts
- **FR-007**: System MUST convert grid positions to absolute positions when switching modes
- **FR-008**: System MUST maintain touch targets of at least 44x44px regardless of zoom level
- **FR-009**: System SHOULD provide "fit all" zoom to show all buttons
- **FR-010**: System SHOULD support adding new buttons at arbitrary positions
- **FR-011**: System MUST limit maximum buttons per board (suggest 50) for performance
- **FR-012**: System MUST maintain z-order (layering) of overlapping buttons

### Key Entities

- **Board** (extended): Add `mode: 'grid' | 'freeform'` field, `canvasWidth`, `canvasHeight`, `zoom`, `panX`, `panY`
- **Button** (extended): Add `x: number`, `y: number`, `width: number`, `height: number`, `zIndex: number` fields (used in freeform mode)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Drag operations maintain 60fps on mid-range devices
- **SC-002**: Pan and zoom feel responsive (<16ms frame time)
- **SC-003**: Position persistence is accurate to within 1px after reload
- **SC-004**: Users can arrange 20 buttons in custom layout in under 5 minutes
- **SC-005**: Mode switching preserves all button content (images, audio, labels)
- **SC-006**: Accessibility scan order is predictable (top-to-bottom, left-to-right)

## Assumptions

- Canvas size is virtual and can be larger than screen (minimum 2x2 screens at default zoom)
- Touch and mouse input both supported
- No collaborative editing (single user per device)
- Undo/redo is out of scope for MVP (can be added later)
