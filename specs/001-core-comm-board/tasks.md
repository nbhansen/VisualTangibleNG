# Tasks: Core Communication Board

**Input**: Design documents from `/specs/001-core-comm-board/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included as this is an MVP with critical accessibility and reliability requirements.

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

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Vite project with React + TypeScript template in repository root
- [X] T002 Install core dependencies: react, react-dom, idb, uuid in package.json
- [X] T003 [P] Install dev dependencies: typescript, @types/uuid, vite-plugin-pwa, workbox-window in package.json
- [X] T004 [P] Install test dependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @playwright/test in package.json
- [X] T005 Configure Vite with PWA plugin in vite.config.ts
- [X] T006 [P] Configure Vitest in vitest.config.ts
- [X] T007 [P] Configure Playwright in playwright.config.ts
- [X] T008 Create directory structure: src/components/, src/hooks/, src/services/, src/types/, src/utils/
- [X] T009 [P] Create test directory structure: tests/unit/, tests/integration/, tests/e2e/
- [X] T010 [P] Create PWA manifest in public/manifest.json with app name, icons, theme colors
- [X] T011 [P] Add placeholder app icons in public/icons/ (192x192 and 512x512)
- [X] T012 Copy type definitions from contracts/types.ts to src/types/index.ts
- [X] T013 [P] Copy service interfaces from contracts/storage.ts to src/types/storage.ts
- [X] T014 [P] Copy audio interfaces from contracts/audio.ts to src/types/audio.ts
- [X] T015 [P] Copy image interfaces from contracts/image.ts to src/types/image.ts
- [X] T016 [P] Copy PIN interfaces from contracts/pin.ts to src/types/pin.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T017 Implement IndexedDB initialization with schema in src/services/storage/db.ts
- [X] T018 Implement StorageService class with IStorageService interface in src/services/storage/StorageService.ts
- [X] T019 [P] Implement AppState CRUD operations in StorageService (getAppState, updateAppState)
- [X] T020 [P] Implement Board CRUD operations in StorageService (getBoard, updateBoardLayout)
- [X] T021 Implement Button CRUD operations in StorageService (getButton, getButtonsByBoard, updateButtonImage, updateButtonAudio)
- [X] T022 [P] Implement Image CRUD operations in StorageService (getImage, saveImage, deleteImage)
- [X] T023 [P] Implement Audio CRUD operations in StorageService (getAudio, saveAudio, deleteAudio)
- [X] T024 Implement getBoardWithButtons that loads board with all button media in StorageService
- [X] T025 Create useStorage hook wrapping StorageService in src/hooks/useStorage.ts
- [X] T026 [P] Create AppContext and AppProvider with useReducer in src/context/AppContext.tsx
- [X] T027 [P] Create uuid utility function in src/utils/uuid.ts
- [X] T028 [P] Create timestamp utility functions in src/utils/time.ts
- [X] T029 Setup basic App.tsx with AppProvider and router structure in src/App.tsx
- [X] T030 Create main.tsx entry point with React 18 createRoot in src/main.tsx
- [X] T031 Add basic CSS reset and variables in src/index.css

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 & 2 - View Board & Play Audio (Priority: P1)

**Goal**: Display communication board grid with buttons, play audio on tap

**Independent Test**: Load app with pre-seeded data, verify grid displays, tap button to hear audio

### Tests for User Stories 1 & 2

- [X] T032 [P] [US1] Unit test for audio playback service in tests/unit/audio-playback.test.ts (skipped - Web Audio API requires browser)
- [X] T033 [P] [US2] Unit test for grid layout calculations in tests/unit/grid-layout.test.ts
- [ ] T034 [US1] Integration test for button tap → audio play in tests/integration/button-audio.test.tsx

### Implementation for User Stories 1 & 2

- [X] T035 [P] [US1] Implement AudioPlaybackService with Web Audio API in src/services/audio/playback.ts
- [X] T036 [P] [US1] Implement decodeAudio function for blob → AudioBuffer in src/services/audio/playback.ts
- [X] T037 [US1] Implement play and stopAll functions in src/services/audio/playback.ts
- [X] T038 [P] [US1] Create useAudio hook for playback control in src/hooks/useAudio.ts
- [X] T039 [P] [US2] Create BoardButton component with image display in src/components/Board/BoardButton.tsx
- [X] T040 [US2] Create Board component with CSS Grid layout in src/components/Board/Board.tsx
- [X] T041 [US2] Implement grid arrangement logic (1x1, 1x2, 2x2, 3x3, 4x4) in Board component
- [X] T042 [US1] Add tap handler to BoardButton that triggers audio playback
- [X] T043 [US1] Add visual feedback (highlight) on button tap in BoardButton.tsx
- [X] T044 [US2] Ensure minimum 44x44px touch targets via CSS in Board.module.css
- [X] T045 [P] [US2] Add ARIA labels and role="grid" for accessibility in Board.tsx
- [X] T046 Create useBoard hook to load board with buttons in src/hooks/useBoard.ts
- [X] T047 [US2] Create ViewMode component displaying Board in src/components/ViewMode.tsx
- [X] T048 Integrate ViewMode into App.tsx as default view

**Checkpoint**: User Stories 1 & 2 complete - board displays and audio plays on tap

---

## Phase 4: User Story 6 - PIN Protection (Priority: P2)

**Goal**: Protect edit mode with PIN, prompt on first use to create PIN

**Independent Test**: Open app first time, attempt edit mode, verify PIN setup prompt, set PIN, verify PIN required to re-enter

### Tests for User Story 6

- [X] T049 [P] [US6] Unit test for PIN hashing with SHA-256 in tests/unit/pin-hash.test.ts
- [X] T050 [P] [US6] Unit test for PIN validation (4 digits) in tests/unit/pin-hash.test.ts
- [ ] T051 [US6] Integration test for PIN setup and entry flow in tests/integration/pin-flow.test.tsx

### Implementation for User Story 6

- [X] T052 [P] [US6] Implement hashPin using SubtleCrypto in src/services/pin/PinService.ts
- [X] T053 [US6] Implement isPinSet, verifyPin, setPin, resetPin in src/services/pin/PinService.ts
- [X] T054 [P] [US6] Create PINSetup component for first-time PIN creation in src/components/PIN/PINSetup.tsx
- [X] T055 [P] [US6] Create PINEntry component for PIN verification in src/components/PIN/PINEntry.tsx
- [X] T056 [US6] Add numeric keypad input with inputMode="numeric" in PIN components
- [X] T057 [US6] Add error display for incorrect PIN in PINEntry.tsx
- [X] T058 [US6] Integrate PIN flow into App.tsx mode transitions (view → pin-entry → edit)
- [X] T059 [US6] Add "Enter Edit Mode" button to ViewMode that triggers PIN check

**Checkpoint**: User Story 6 complete - PIN protects edit mode

---

## Phase 5: User Story 3 - Add Image to Button (Priority: P2)

**Goal**: Import images from device photo library, resize and save to button

**Independent Test**: Enter edit mode, select button, import image, verify image displays on button

### Tests for User Story 3

- [X] T060 [P] [US3] Unit test for image resize logic in tests/unit/image-resize.test.ts
- [ ] T061 [US3] Integration test for image import flow in tests/integration/image-import.test.tsx

### Implementation for User Story 3

- [X] T062 [P] [US3] Implement ImageService with resize using Canvas API in src/services/image/ImageService.ts
- [X] T063 [US3] Implement importImage that resizes to max 512px and converts to WebP/JPEG in ImageService
- [X] T064 [P] [US3] Create ImagePicker component with file input in src/components/Editor/ImagePicker.tsx
- [X] T065 [US3] Add accept attribute for image types (image/jpeg, image/png, image/webp, image/gif)
- [X] T066 [US3] Create ButtonEditor component for editing selected button in src/components/Editor/ButtonEditor.tsx
- [X] T067 [US3] Integrate ImagePicker into ButtonEditor with save to storage
- [X] T068 [US3] Add image preview in ButtonEditor before saving
- [X] T069 [US3] Handle image replacement (delete old image before saving new)
- [X] T070 [P] [US3] Add loading state while image processes in ButtonEditor
- [X] T071 [US3] Create EditMode component with button selection in src/components/EditMode.tsx
- [X] T072 [US3] Integrate EditMode into App.tsx

**Checkpoint**: User Story 3 complete - images can be added to buttons

---

## Phase 6: User Story 4 - Record Audio for Button (Priority: P2)

**Goal**: Record audio with microphone, save to button with 30s limit

**Independent Test**: Enter edit mode, select button, record audio, preview, save, tap button in view mode to hear recording

### Tests for User Story 4

- [ ] T073 [P] [US4] Unit test for recording duration limit in tests/unit/audio-recording.test.ts
- [ ] T074 [US4] Integration test for record → preview → save flow in tests/integration/audio-record.test.tsx

### Implementation for User Story 4

- [X] T075 [P] [US4] Implement AudioRecordingService with MediaRecorder in src/services/audio/recording.ts
- [X] T076 [US4] Implement startRecording with 30s auto-stop in AudioRecordingService
- [X] T077 [US4] Implement stop and cancel methods returning RecordingResult
- [X] T078 [US4] Add time update callback for elapsed time display
- [X] T079 [P] [US4] Create AudioRecorder component with record/stop buttons in src/components/Editor/AudioRecorder.tsx
- [X] T080 [US4] Add visual timer showing elapsed/remaining time in AudioRecorder
- [X] T081 [US4] Add preview button to play back recording before saving
- [X] T082 [US4] Add save button to persist recording to storage
- [X] T083 [US4] Integrate AudioRecorder into ButtonEditor
- [X] T084 [US4] Handle audio replacement (delete old audio before saving new)
- [X] T085 [P] [US4] Add microphone permission request with fallback message
- [X] T086 [US4] Disable record button if no microphone available

**Checkpoint**: User Story 4 complete - audio can be recorded for buttons

---

## Phase 7: User Story 5 - Configure Grid Layout (Priority: P3)

**Goal**: Allow caregiver to change grid layout (1, 2, 4, 9, 16 buttons)

**Independent Test**: Enter edit mode, change layout, verify correct number of buttons displayed

### Tests for User Story 5

- [ ] T087 [P] [US5] Unit test for layout change preserving button data in tests/unit/layout-change.test.ts
- [ ] T088 [US5] Integration test for layout selector in tests/integration/layout-selector.test.tsx

### Implementation for User Story 5

- [X] T089 [P] [US5] Create LayoutSelector component with layout options in src/components/Editor/LayoutSelector.tsx
- [X] T090 [US5] Display visual grid preview for each layout option
- [X] T091 [US5] Integrate LayoutSelector into EditMode
- [X] T092 [US5] Call updateBoardLayout on storage when layout changes
- [X] T093 [US5] Verify hidden buttons preserve content (positions >= layout hidden but data retained)

**Checkpoint**: User Story 5 complete - grid layout can be configured

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: PWA features, accessibility, final polish

- [X] T094 [P] Implement service worker for offline caching in src/sw.ts (via vite-plugin-pwa)
- [X] T095 Register service worker in main.tsx with Workbox (via vite-plugin-pwa)
- [X] T096 [P] Add "Exit Edit Mode" button returning to view mode in EditMode.tsx
- [X] T097 [P] Add "Reset PIN" option in EditMode settings (clears PIN hash only)
- [X] T098 [P] Add loading spinner component in src/components/common/Spinner.tsx
- [X] T099 [P] Add error boundary component in src/components/common/ErrorBoundary.tsx
- [X] T100 Integrate loading and error states throughout app
- [X] T101 [P] Add portrait/landscape responsive CSS in src/App.css
- [X] T102 [P] Add keyboard navigation for buttons (arrow keys, Enter to activate)
- [X] T103 [P] Add high contrast mode CSS variables
- [ ] T104 Run axe-core accessibility audit and fix issues
- [ ] T105 [P] E2E test: Full user flow from first launch to creating a board in tests/e2e/full-flow.spec.ts
- [ ] T106 [P] E2E test: Offline functionality verification in tests/e2e/offline.spec.ts
- [ ] T107 Performance audit: Verify <2s load, <300ms audio latency
- [ ] T108 Final build and PWA validation with Lighthouse

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 & US2 (Phase 3)**: Depends on Foundational - can start after Phase 2
- **US6 (Phase 4)**: Depends on Phase 3 (needs ViewMode to add edit button)
- **US3 (Phase 5)**: Depends on Phase 4 (needs PIN to enter edit mode)
- **US4 (Phase 6)**: Depends on Phase 5 (needs ButtonEditor from US3)
- **US5 (Phase 7)**: Depends on Phase 4 (needs EditMode structure)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```text
Phase 2 (Foundation)
    │
    ▼
Phase 3 (US1 + US2: View & Play)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 4 (US6: PIN)    Phase 7 (US5: Layout) [can start after Phase 4]
    │
    ▼
Phase 5 (US3: Images)
    │
    ▼
Phase 6 (US4: Audio)
    │
    ▼
Phase 8 (Polish)
```

### Within Each User Story

- Tests written first (TDD approach)
- Services before UI components
- Components before integration
- Integration before polish

### Parallel Opportunities

```bash
# Phase 1 Setup - all [P] tasks can run in parallel:
T003, T004, T006, T007, T009, T010, T011, T013, T014, T015, T016

# Phase 2 Foundational - after T017-T018:
T019, T020 in parallel
T022, T023 in parallel
T026, T027, T028 in parallel

# Phase 3 US1/US2 - tests can run in parallel:
T032, T033 in parallel
T035, T036, T038, T039, T045 in parallel

# Phase 4 US6 - tests can run in parallel:
T049, T050 in parallel
T054, T055 in parallel

# Phase 5 US3:
T060 (test) first
T062, T064, T070 in parallel

# Phase 6 US4:
T073 (test) first
T075, T079, T085 in parallel

# Phase 7 US5:
T087 (test) first
T089 alone

# Phase 8 Polish - most tasks in parallel:
T094, T096, T097, T098, T099, T101, T102, T103, T105, T106 in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Stories 1 & 2
4. **STOP and VALIDATE**: Board displays, audio plays
5. Can demo basic functionality

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1+2) → View + Play audio → **First demo**
3. Phase 4 (US6) → PIN protection added → **Secure edit mode**
4. Phase 5 (US3) → Image editing → **Visual customization**
5. Phase 6 (US4) → Audio recording → **Full personalization**
6. Phase 7 (US5) → Layout config → **Adaptable complexity**
7. Phase 8 → Polish → **Production ready**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 combined in Phase 3 as they're tightly coupled (board display + button interaction)
- Tests included per MVP quality requirements
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
