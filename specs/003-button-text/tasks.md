# Tasks: Button Text Labels

**Input**: Design documents from `/specs/003-button-text/`
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

**Purpose**: Type definitions and contract copying

- [ ] T001 Add LabelPosition type ('above' | 'below' | 'hidden') to src/types/index.ts
- [ ] T002 [P] Add MAX_LABEL_LENGTH constant (50) to src/types/index.ts
- [ ] T003 [P] Copy isValidLabel function from contracts/labels.ts to src/types/index.ts
- [ ] T004 [P] Copy normalizeLabel function from contracts/labels.ts to src/types/index.ts

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Add label field (string | null) to Button interface in src/types/index.ts
- [ ] T006 Add labelPosition field (LabelPosition) to Board interface in src/types/index.ts
- [ ] T007 Increment DB_VERSION from 1 to 2 in src/services/storage/db.ts
- [ ] T008 Add migration logic for v1→v2 to set default labelPosition='below' on existing boards in db.ts
- [ ] T009 Implement updateButtonLabel method in src/services/storage/StorageService.ts
- [ ] T010 Implement updateBoardLabelPosition method in StorageService.ts
- [ ] T011 Update getBoardWithButtons to include label field in returned buttons in StorageService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Display Text Labels (Priority: P1)

**Goal**: Show text labels below button images when configured

**Independent Test**: Open board with buttons that have labels configured. Verify text appears below each button image.

### Implementation for User Story 1

- [ ] T012 [US1] Add label prop to BoardButton component in src/components/Board/BoardButton.tsx
- [ ] T013 [US1] Add labelPosition prop to BoardButton component in BoardButton.tsx
- [ ] T014 [US1] Render label span element when label is non-null and position is not 'hidden' in BoardButton.tsx
- [ ] T015 [P] [US1] Add .button-label CSS styles with system font stack in src/components/Board/BoardButton.css
- [ ] T016 [P] [US1] Add responsive font sizing with clamp() in BoardButton.css
- [ ] T017 [P] [US1] Add text truncation with -webkit-line-clamp (max 2 lines) in BoardButton.css
- [ ] T018 [US1] Use flexbox with flex-direction to position label above or below in BoardButton.css
- [ ] T019 [US1] Add data-label-position attribute for CSS styling in BoardButton.tsx
- [ ] T020 [US1] Pass labelPosition from board to each BoardButton in src/components/Board/Board.tsx
- [ ] T021 [US1] Add dir="auto" attribute to label for RTL support in BoardButton.tsx
- [ ] T022 [P] [US1] Add high contrast mode styles for labels in BoardButton.css
- [ ] T023 [US1] Ensure label is part of button's accessible name (aria-label) in BoardButton.tsx

**Checkpoint**: User Story 1 complete - labels display on buttons

---

## Phase 4: User Story 2 - Add/Edit Labels (Priority: P1)

**Goal**: Allow caregivers to add and edit text labels in edit mode

**Independent Test**: Enter edit mode, select button, add text label, exit edit mode. Verify label appears on button.

### Implementation for User Story 2

- [ ] T024 [US2] Add label input field to ButtonEditor component in src/components/Editor/ButtonEditor.tsx
- [ ] T025 [US2] Add local state for label value in ButtonEditor.tsx
- [ ] T026 [US2] Initialize label state from button.label on mount in ButtonEditor.tsx
- [ ] T027 [US2] Add maxLength={50} attribute to label input in ButtonEditor.tsx
- [ ] T028 [P] [US2] Add character counter display showing {length}/50 in ButtonEditor.tsx
- [ ] T029 [US2] Call normalizeLabel before saving to storage in ButtonEditor.tsx
- [ ] T030 [US2] Call storageService.updateButtonLabel on save in ButtonEditor.tsx
- [ ] T031 [P] [US2] Add label input styling in src/components/Editor/Editor.css
- [ ] T032 [US2] Refresh board display after label save to show updated label

**Checkpoint**: User Story 2 complete - labels can be added and edited

---

## Phase 5: User Story 3 - Configure Label Position (Priority: P3)

**Goal**: Allow caregivers to set label position (above, below, hidden) at board level

**Independent Test**: Change label position setting, verify all buttons update to show labels in new position.

### Implementation for User Story 3

- [ ] T033 [US3] Create LabelPositionSelector component in src/components/Editor/LabelPositionSelector.tsx
- [ ] T034 [US3] Add radio inputs for 'below', 'above', 'hidden' options in LabelPositionSelector.tsx
- [ ] T035 [P] [US3] Add CSS styling for LabelPositionSelector in Editor.css
- [ ] T036 [US3] Add LabelPositionSelector to EditMode settings section in src/components/EditMode.tsx
- [ ] T037 [US3] Load current labelPosition from board in EditMode.tsx
- [ ] T038 [US3] Call storageService.updateBoardLabelPosition on selection change
- [ ] T039 [US3] Refresh board display after position change to update all buttons

**Checkpoint**: User Story 3 complete - label position can be configured

---

## Phase 6: Polish & Edge Cases

**Purpose**: Final polish and edge case handling

- [ ] T040 [P] Add larger font sizes for 1-2 button layouts in BoardButton.css
- [ ] T041 [P] Add dark mode label color variables in BoardButton.css
- [ ] T042 Handle undefined label as null in BoardButton (backwards compatibility)
- [ ] T043 Handle undefined labelPosition as 'below' in Board (backwards compatibility)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - can start after Phase 2
- **US2 (Phase 4)**: Depends on Foundational - can run parallel with US1
- **US3 (Phase 5)**: Depends on Foundational - can run parallel with US1/US2
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

```text
Phase 2 (Foundation)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
Phase 3 (US1)      Phase 4 (US2)      Phase 5 (US3)
    │                  │                  │
    └──────────────────┴──────────────────┘
                       │
                       ▼
               Phase 6 (Polish)
```

### Parallel Opportunities

```bash
# Phase 1 Setup:
T002, T003, T004 in parallel

# Phase 2 Foundational - mostly sequential:
T005 → T006 → T007 → T008 → T009, T010 in parallel → T011

# Phase 3 US1:
T015, T016, T017, T022 in parallel (CSS only)
T012 → T013 → T014 → T018 → T019 → T020 → T021 → T023

# Phase 4 US2:
T028, T031 in parallel (independent additions)
T024 → T025 → T026 → T027 → T029 → T030 → T032

# Phase 5 US3:
T035 in parallel with T033
T033 → T034 → T036 → T037 → T038 → T039

# Phase 6 Polish:
T040, T041 in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Display)
4. Complete Phase 4: User Story 2 (Edit)
5. **STOP and VALIDATE**: Labels display and can be edited
6. Can demo label functionality with default position

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (schema migration)
2. Phase 3 (US1) → Labels display → **Visual demo**
3. Phase 4 (US2) → Labels editable → **Full edit flow**
4. Phase 5 (US3) → Position config → **Complete customization**
5. Phase 6 → Polish → **Production ready**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 are both P1 priority - implement together for complete feature
- Schema migration (v1→v2) required for persistent storage
- Total: 43 tasks (4 setup, 7 foundational, 12 US1, 9 US2, 7 US3, 4 polish)
