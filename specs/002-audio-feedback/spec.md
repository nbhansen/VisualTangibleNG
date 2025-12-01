# Feature Specification: Audio Playback Feedback

**Feature Branch**: `002-audio-feedback`
**Created**: 2025-12-01
**Status**: Draft
**Input**: User description: "Clearer visual feedback when audio is playing - pulsing animation, progress indicator, and visual cue that a button's sound is active"
**Depends On**: 001-core-comm-board (must be complete)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Which Button Is Playing (Priority: P1)

A child or caregiver taps a communication button and sees clear visual feedback that audio is playing. This helps users understand which button is active, especially important for users with cognitive differences who benefit from multimodal feedback.

**Why this priority**: Core usability improvement - users need to know their tap was registered and which sound is playing, especially when multiple buttons might be tapped in sequence.

**Independent Test**: Tap any button with audio. Verify visual indicator appears immediately and persists for duration of audio playback.

**Acceptance Scenarios**:

1. **Given** a button with audio is tapped, **When** audio begins playing, **Then** the button displays a pulsing animation that is visually distinct from the tap highlight
2. **Given** audio is playing on a button, **When** the audio completes, **Then** the pulsing animation stops smoothly
3. **Given** audio is playing on button A, **When** button B is tapped, **Then** button A's animation stops and button B's animation begins
4. **Given** the user has reduced-motion preferences enabled, **When** audio plays, **Then** a static visual indicator (e.g., border glow) is shown instead of animation

---

### User Story 2 - See Audio Progress (Priority: P2)

A caregiver or older child can see a progress indicator showing how much of the audio has played. This is useful for longer recordings (up to 30 seconds) so users know when the sound will finish.

**Why this priority**: Enhances understanding of audio duration but not critical for basic communication function.

**Independent Test**: Tap a button with a 10+ second recording. Verify progress indicator shows advancement from 0% to 100%.

**Acceptance Scenarios**:

1. **Given** audio is playing, **When** viewing the active button, **Then** a progress indicator shows percentage complete (ring, bar, or similar)
2. **Given** a 15-second audio clip is playing, **When** 7.5 seconds have elapsed, **Then** the progress indicator shows approximately 50%
3. **Given** audio playback is interrupted by tapping another button, **When** the first button stops, **Then** its progress indicator resets

---

### User Story 3 - Audio State Persistence Across Views (Priority: P3)

If a user switches between view mode and edit mode while audio is playing, the visual feedback should accurately reflect the current audio state.

**Why this priority**: Edge case handling - most users won't switch modes during playback, but UI should remain consistent.

**Independent Test**: Start audio playback, switch to edit mode, switch back to view mode. Verify state is consistent.

**Acceptance Scenarios**:

1. **Given** audio is playing in view mode, **When** user enters edit mode (via PIN), **Then** audio stops and feedback clears
2. **Given** no audio was playing, **When** entering view mode, **Then** no buttons show playing state

---

### Edge Cases

- What happens when audio file is corrupted and fails mid-playback? Visual feedback stops immediately with no error shown to user.
- What happens on very short audio (<500ms)? Animation still briefly appears so user sees feedback.
- What happens if device enters sleep during playback? Audio stops, animation clears on wake.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a pulsing animation on buttons while their audio is playing
- **FR-002**: System MUST stop animation when audio completes or is interrupted
- **FR-003**: System MUST respect prefers-reduced-motion and show static indicator instead
- **FR-004**: System SHOULD show progress indicator for audio duration
- **FR-005**: System MUST ensure only one button shows "playing" state at a time
- **FR-006**: System MUST use CSS animations (not JavaScript intervals) for performance

### Key Entities

- **PlaybackState**: Extends existing audio playback - adds currentButtonId, progress (0-1), isPlaying boolean
- **AnimationConfig**: Settings for pulse speed, color, reduced-motion fallback

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify which button is playing audio within 100ms of tap
- **SC-002**: Animation frame rate stays at 60fps during playback (no jank)
- **SC-003**: Progress indicator accuracy within 5% of actual audio position
- **SC-004**: Accessibility audit passes for motion and visual feedback
