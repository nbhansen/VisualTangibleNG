# Tasks: Audio Playback Feedback

**Input**: Design documents from `/specs/002-audio-feedback/`
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

- [X] T001 Copy PlaybackProgress interface from contracts/playback.ts to src/types/audio.ts
- [X] T002 [P] Copy UseAudioWithFeedbackReturn interface from contracts/playback.ts to src/types/audio.ts

---

## Phase 2: Foundational

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extend playback service to track current buttonId in src/services/audio/playback.ts
- [X] T004 Add startTime and duration tracking to playback service in src/services/audio/playback.ts
- [X] T005 Implement getPlaybackProgress() function returning PlaybackProgress in src/services/audio/playback.ts
- [X] T006 Add onProgress callback parameter to play() function in src/services/audio/playback.ts
- [X] T007 Extend useAudio hook to expose playingButtonId in src/hooks/useAudio.ts
- [X] T008 Add progress state (0-1) to useAudio hook in src/hooks/useAudio.ts
- [X] T009 Implement requestAnimationFrame progress updates in useAudio hook

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - See Which Button Is Playing (Priority: P1)

**Goal**: Display pulsing animation on button while audio plays, respect reduced-motion

**Independent Test**: Tap any button with audio. Verify visual indicator appears immediately and persists for duration of audio playback.

### Implementation for User Story 1

- [X] T010 [US1] Add isPlaying prop to BoardButton component in src/components/Board/BoardButton.tsx
- [X] T011 [US1] Add .playing CSS class conditionally based on isPlaying prop in BoardButton.tsx
- [X] T012 [P] [US1] Add @keyframes pulse animation in src/components/Board/BoardButton.css
- [X] T013 [US1] Add .playing class styles with animation property in BoardButton.css
- [X] T014 [P] [US1] Add prefers-reduced-motion media query with static glow fallback in BoardButton.css
- [X] T015 [US1] Pass playingButtonId from useAudio to Board component in src/components/ViewMode.tsx
- [X] T016 [US1] Pass isPlaying={playingButtonId === button.id} to each BoardButton in Board.tsx
- [X] T017 [US1] Add aria-pressed attribute reflecting playing state in BoardButton.tsx

**Checkpoint**: User Story 1 complete - pulsing animation shows which button is playing

---

## Phase 4: User Story 2 - See Audio Progress (Priority: P2)

**Goal**: Show progress indicator (ring) showing playback position

**Independent Test**: Tap a button with a 10+ second recording. Verify progress indicator shows advancement from 0% to 100%.

### Implementation for User Story 2

- [X] T018 [US2] Add progress prop (0-1) to BoardButton component in BoardButton.tsx
- [X] T019 [P] [US2] Create SVG progress ring component (circle with stroke-dashoffset) in BoardButton.tsx
- [X] T020 [US2] Add .progress-ring CSS styles in BoardButton.css
- [X] T021 [US2] Calculate strokeDashoffset from progress value in BoardButton.tsx
- [X] T022 [US2] Only render progress ring when isPlaying is true in BoardButton.tsx
- [X] T023 [US2] Pass progress from useAudio to Board component in ViewMode.tsx
- [X] T024 [US2] Pass progress to BoardButton (only for playing button) in Board.tsx
- [X] T025 [P] [US2] Add transition for smooth progress ring updates in BoardButton.css

**Checkpoint**: User Story 2 complete - progress ring shows playback position

---

## Phase 5: User Story 3 - Audio State Across Mode Changes (Priority: P3)

**Goal**: Stop audio and clear feedback when entering edit mode

**Independent Test**: Start audio playback, switch to edit mode, switch back to view mode. Verify state is consistent.

### Implementation for User Story 3

- [X] T026 [US3] Call stopAll() when transitioning from view to edit mode in src/components/ViewMode.tsx
- [X] T027 [US3] Ensure playingButtonId resets to null when stop() is called in useAudio.ts
- [X] T028 [US3] Clear progress state when audio stops in useAudio.ts

**Checkpoint**: User Story 3 complete - audio state handled correctly across mode changes

---

## Phase 6: Polish & Edge Cases

**Purpose**: Final polish and edge case handling

- [X] T029 [P] Handle audio decode/playback errors - clear playing state on error in useAudio.ts
- [X] T030 [P] Ensure animation completes smoothly on very short audio (<500ms) via CSS animation-duration
- [X] T031 Add cleanup on component unmount to stop progress tracking in useAudio.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - can start after Phase 2
- **US2 (Phase 4)**: Depends on US1 (uses same props pattern)
- **US3 (Phase 5)**: Depends on Foundational only (independent of US1/US2)
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

```text
Phase 2 (Foundation)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (US1)      Phase 5 (US3)
    │
    ▼
Phase 4 (US2)
    │
    ▼
Phase 6 (Polish)
```

### Parallel Opportunities

```bash
# Phase 1 Setup:
T001, T002 in parallel

# Phase 2 Foundational - sequential (T003 blocks T004-T006):
T003 → T004 → T005 → T006 → T007 → T008 → T009

# Phase 3 US1:
T012, T014 in parallel (CSS files)
T010 → T011 → T015 → T016 → T017

# Phase 4 US2:
T019, T025 in parallel (independent CSS/component)
T018 → T020 → T021 → T022 → T023 → T024

# Phase 5 US3:
T026, T027, T028 sequential (dependencies)

# Phase 6 Polish:
T029, T030 in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Pulsing animation shows on playing button
5. Can demo basic visual feedback

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Pulse animation → **First demo**
3. Phase 4 (US2) → Progress ring → **Enhanced feedback**
4. Phase 5 (US3) → Mode handling → **Robust behavior**
5. Phase 6 → Polish → **Production ready**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- No database changes - all state is runtime only
- CSS animations for performance (GPU-accelerated)
- Total: 31 tasks (2 setup, 7 foundational, 8 US1, 8 US2, 3 US3, 3 polish)
