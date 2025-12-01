# Implementation Plan: Core Communication Board

**Branch**: `001-core-comm-board` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-comm-board/spec.md`

## Summary

Build the core MVP communication board: a PWA that displays a configurable grid of buttons (1-16), where each button can have an image and recorded audio. Tapping a button plays its audio. Caregivers can enter a PIN-protected edit mode to add images from the photo library and record audio (max 30 seconds). All data persists locally via IndexedDB and the app works fully offline.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Vite, Workbox (service worker)
**Storage**: IndexedDB (via idb library) for structured data, Cache API for assets
**Audio**: Web Audio API for playback, MediaRecorder API for recording
**Testing**: Vitest + React Testing Library + Playwright (e2e)
**Target Platform**: PWA - Chrome, Firefox, Safari, Edge (latest 2 versions)
**Project Type**: Single frontend project (no backend)
**Performance Goals**: <300ms audio playback latency, <2s initial load, 60fps UI
**Constraints**: Fully offline after first load, <50MB total app size, no server dependencies
**Scale/Scope**: Single board, 1-16 buttons, single user per device

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Offline-First PWA | All features work offline | PASS | Service worker + IndexedDB + Cache API |
| II. Local Data Ownership | Data stored locally, exportable | PASS | IndexedDB storage, export deferred to future feature |
| III. Accessibility-First | 44x44px touch targets, ARIA, keyboard nav | PASS | FR-009 specifies 44px minimum |
| IV. Zero-Friction Editing | <30s to add button content | PASS | SC-002 specifies <60s for image + audio |
| V. Privacy & Child Safety | No accounts, no tracking, PIN protection | PASS | FR-013/014 add PIN protection |
| VI. Open Source | MIT license, documented | PASS | Will document all APIs |
| VII. Pluggable AI | AI behind abstraction layer | N/A | No AI in MVP (recording only) |

**Gate Result**: PASS - All applicable principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-comm-board/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal TypeScript interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/          # React components
│   ├── Board/           # Grid display, button rendering
│   ├── Editor/          # Edit mode UI (image picker, audio recorder)
│   ├── PIN/             # PIN entry and setup dialogs
│   └── common/          # Shared UI components
├── hooks/               # Custom React hooks
│   ├── useAudio.ts      # Audio playback/recording
│   ├── useBoard.ts      # Board state management
│   └── useStorage.ts    # IndexedDB operations
├── services/            # Business logic
│   ├── storage/         # IndexedDB service
│   ├── audio/           # Audio recording/playback service
│   └── image/           # Image import/resize service
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── sw.ts                # Service worker

public/
├── manifest.json        # PWA manifest
└── icons/               # App icons

tests/
├── unit/                # Unit tests (Vitest)
├── integration/         # Component integration tests
└── e2e/                 # End-to-end tests (Playwright)
```

**Structure Decision**: Single frontend project with React + TypeScript. No backend required per constitution. All state management via React hooks + IndexedDB.

## Complexity Tracking

No constitution violations requiring justification.

## Future: Native App Deployment

**Decision**: Start with PWA, add Capacitor for native app stores later.

**Rationale**:
- Get working product fast with web-only approach
- Same codebase can be wrapped for iOS/Android via Capacitor
- No app store fees or review delays during development
- PWA allows easy testing and sharing during MVP phase

**When to add Capacitor**:
- After MVP is validated with real users
- If app store distribution becomes a requirement
- If native APIs needed (better iOS audio recording, etc.)

**Migration path**:
```
Phase 1 (now):  PWA only → test on any device via browser
Phase 2 (later): Add Capacitor → same code, deploy to App Store / Play Store
```

**Capacitor additions when ready**:
- `npm install @capacitor/core @capacitor/cli`
- `npm install @capacitor/ios @capacitor/android`
- Native audio plugin if Web Audio has issues on iOS
- App store assets (screenshots, descriptions)
