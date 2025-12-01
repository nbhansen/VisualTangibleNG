# Data Model: Audio Playback Feedback

**Feature**: 002-audio-feedback
**Date**: 2025-12-01

## Overview

This feature adds **runtime state only** - no persistent data model changes. The playback feedback state exists only during audio playback and is not stored in IndexedDB.

## Runtime State Entities

### PlaybackState

Tracks the current audio playback status for visual feedback.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| buttonId | string | Yes | ID of the button currently playing audio |
| isPlaying | boolean | Yes | Whether audio is actively playing |
| startTime | number | Yes | AudioContext time when playback started |
| duration | number | Yes | Total duration of audio in seconds |
| progress | number | Yes | Current progress 0-1 (computed from elapsed/duration) |

**Computed Fields**:
- `elapsed`: `audioContext.currentTime - startTime`
- `progress`: `Math.min(elapsed / duration, 1)`
- `remaining`: `duration - elapsed`

**State Transitions**:
```text
Idle (null) → Playing { buttonId, isPlaying: true, startTime, duration }
Playing → Idle (null)          [audio completes or stop() called]
Playing → Playing (new button) [different button tapped, replaces state]
```

### AnimationState (CSS-driven)

Not a JS object - controlled via CSS classes on BoardButton.

| Class | Condition | Visual Effect |
|-------|-----------|---------------|
| `.playing` | buttonId matches this button | Pulse animation |
| `.playing` + prefers-reduced-motion | Same, user prefers no motion | Static glow |

## No Database Changes

This feature does **not** modify the IndexedDB schema. All state is ephemeral:

- PlaybackState is held in React state (useAudio hook)
- Animation classes are applied/removed based on playingButtonId
- Progress updates via requestAnimationFrame during playback
- State resets to null when audio completes or component unmounts

## State Flow Diagram

```text
User taps Button A
       │
       ▼
┌──────────────────┐
│  play(audioBlob, │
│    buttonId: A)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ PlaybackState =  │
│ { buttonId: A,   │
│   isPlaying: true│
│   startTime: now │
│   duration: 5s } │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Button A gets    │────▶│ Progress updates │
│ .playing class   │     │ every 100ms      │
└──────────────────┘     └────────┬─────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│ Audio completes  │                              │ User taps        │
│ (5s elapsed)     │                              │ Button B         │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│ PlaybackState =  │                              │ Stop A, start B  │
│ null             │                              │ PlaybackState =  │
│ .playing removed │                              │ { buttonId: B }  │
└──────────────────┘                              └──────────────────┘
```

## Integration with Existing Models

### Button (from 001-core-comm-board)

No changes to Button entity. The `buttonId` in PlaybackState references Button.id.

### Board (from 001-core-comm-board)

No changes to Board entity.

## Migration

No migration needed - no persistent data changes.
