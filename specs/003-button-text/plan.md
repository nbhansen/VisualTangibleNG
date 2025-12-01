# Implementation Plan: Button Text Labels

**Branch**: `003-button-text` | **Date**: 2025-12-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-button-text/spec.md`
**Depends On**: 001-core-comm-board (must be complete)

## Summary

Add text labels to communication buttons, displayed below (default), above, or hidden. Labels support dual-coding (visual + text) for literacy development and help caregivers identify buttons quickly. Includes text input in ButtonEditor and board-level position configuration.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (existing from 001-core-comm-board)
**Primary Dependencies**: Existing dependencies only
**Storage**: IndexedDB - extends Button and Board entities
**Testing**: Vitest (unit), React Testing Library (integration)
**Target Platform**: PWA - Chrome, Firefox, Safari, Edge (latest 2 versions)
**Project Type**: Single project (extends existing)
**Performance Goals**: Text rendering at 60fps, no layout shift on load
**Constraints**: WCAG AA contrast (4.5:1), max 50 characters, responsive font sizing
**Scale/Scope**: Modifies Button entity, Board entity, BoardButton component, ButtonEditor component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation |
|-----------|--------|----------------|
| I. Offline-First PWA | PASS | Labels stored in IndexedDB |
| II. Local Data Ownership | PASS | Labels part of exportable board data |
| III. Accessibility-First | PASS | WCAG AA contrast, supports screen readers |
| IV. Zero-Friction Editing | PASS | Simple text input, <10s to add label |
| V. Privacy & Child Safety | PASS | No data transmission |
| VI. Open Source | PASS | No new dependencies |
| VII. Pluggable AI | N/A | No AI features |

## Project Structure

### Documentation (this feature)

```text
specs/003-button-text/
├── plan.md              # This file
├── research.md          # Typography and layout research
├── data-model.md        # Extended Button and Board entities
├── quickstart.md        # Implementation guide
└── contracts/           # TypeScript interfaces
    └── labels.ts        # Label-related types
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Board/
│   │   ├── BoardButton.tsx      # MODIFY: Add label display
│   │   └── BoardButton.css      # MODIFY: Add label styles
│   └── Editor/
│       ├── ButtonEditor.tsx     # MODIFY: Add label input
│       └── LabelPositionSelector.tsx  # NEW: Label position radio selector
├── services/
│   └── storage/
│       ├── db.ts                # MODIFY: Schema migration for label fields
│       └── StorageService.ts    # MODIFY: Handle label CRUD
└── types/
    └── index.ts                 # MODIFY: Add label fields to Button, Board

tests/
└── unit/
    └── button-labels.test.ts    # NEW: Label validation tests
```

**Structure Decision**: Extends existing single project structure. Schema migration needed for new fields.

## Complexity Tracking

No constitution violations. Straightforward entity extension with schema migration.
