# Implementation Plan: Audio Playback Feedback

**Branch**: `002-audio-feedback` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-audio-feedback/spec.md`
**Depends On**: 001-core-comm-board (must be complete)

## Summary

Add clear visual feedback when audio is playing on communication buttons. Includes pulsing animation while audio plays, optional progress indicator showing playback position, and proper handling of reduced-motion preferences. Enhances usability for users who need multimodal feedback.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (existing from 001-core-comm-board)
**Primary Dependencies**: Existing dependencies only - CSS animations, Web Audio API
**Storage**: N/A - playback state is runtime only, not persisted
**Testing**: Vitest (unit), React Testing Library (integration)
**Target Platform**: PWA - Chrome, Firefox, Safari, Edge (latest 2 versions)
**Project Type**: Single project (extends existing)
**Performance Goals**: 60fps animations, no jank during playback
**Constraints**: Must use CSS animations (not JS intervals), respect prefers-reduced-motion
**Scale/Scope**: Modifies BoardButton component, extends useAudio hook

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Offline-First PWA | PASS | No network required, CSS animations work offline |
| II. Local Data Ownership | N/A | No data storage changes |
| III. Accessibility-First | PASS | Respects prefers-reduced-motion, visual feedback aids comprehension |
| IV. Zero-Friction Editing | N/A | View mode enhancement only |
| V. Privacy & Child Safety | PASS | No data collection |
| VI. Open Source | PASS | No new dependencies |
| VII. Pluggable AI | N/A | No AI features |

## Project Structure

### Documentation (this feature)

```text
specs/002-audio-feedback/
├── plan.md              # This file
├── research.md          # Animation techniques research
├── data-model.md        # PlaybackState interface
├── quickstart.md        # Implementation guide
└── contracts/           # TypeScript interfaces
    └── playback.ts      # Extended playback types
```

### Source Code (repository root)

```text
src/
├── components/
│   └── Board/
│       ├── BoardButton.tsx      # MODIFY: Add playing state, animation classes
│       └── BoardButton.css      # MODIFY: Add pulse animation, progress ring
├── hooks/
│   └── useAudio.ts              # MODIFY: Expose playback progress, current button
└── services/
    └── audio/
        └── playback.ts          # MODIFY: Add progress tracking callback

tests/
└── unit/
    └── audio-feedback.test.ts   # NEW: Animation state tests
```

**Structure Decision**: Extends existing single project structure. No new directories needed - modifications to existing Board and audio modules.

## Complexity Tracking

No constitution violations. Simple CSS animation enhancement with minimal code changes.
