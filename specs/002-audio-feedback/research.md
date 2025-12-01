# Research: Audio Playback Feedback

**Feature**: 002-audio-feedback
**Date**: 2025-12-01

## Technology Decisions

### 1. Animation Approach: CSS Animations with @keyframes

**Decision**: Use pure CSS animations via @keyframes for pulse effect.

**Rationale**:
- GPU-accelerated, maintains 60fps even on low-end devices
- No JavaScript execution during animation = no jank
- Easy to disable via prefers-reduced-motion media query
- Browser handles timing, no requestAnimationFrame management needed

**Alternatives Considered**:
- JavaScript setInterval: Poor performance, blocks main thread
- requestAnimationFrame: More control but unnecessary complexity
- CSS transitions: Better for state changes, not continuous animations
- React Spring/Framer Motion: Overkill for simple pulse, adds dependency

**Implementation Notes**:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--accent), 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(var(--accent), 0); }
}

.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .playing {
    animation: none;
    box-shadow: 0 0 0 4px var(--accent);
  }
}
```

### 2. Progress Indicator: SVG Circle with stroke-dashoffset

**Decision**: Use SVG circle element with animated stroke-dashoffset for progress ring.

**Rationale**:
- Resolution-independent (scales with button size)
- Smooth animation via CSS transition
- Lightweight, no canvas overhead
- Works well with CSS variables for theming

**Alternatives Considered**:
- Canvas 2D: More complex, requires JS drawing
- CSS conic-gradient: Limited browser support, harder to animate smoothly
- HTML progress element: Poor styling options
- Third-party library: Unnecessary dependency

**Implementation Notes**:
```tsx
// Progress ring using stroke-dasharray/dashoffset technique
const circumference = 2 * Math.PI * radius;
const offset = circumference * (1 - progress);

<svg viewBox="0 0 100 100">
  <circle
    cx="50" cy="50" r="45"
    fill="none"
    stroke="var(--progress-bg)"
    strokeWidth="4"
  />
  <circle
    cx="50" cy="50" r="45"
    fill="none"
    stroke="var(--accent)"
    strokeWidth="4"
    strokeDasharray={circumference}
    strokeDashoffset={offset}
    style={{ transition: 'stroke-dashoffset 100ms linear' }}
  />
</svg>
```

### 3. Progress Tracking: Web Audio API currentTime

**Decision**: Track playback progress via AudioBufferSourceNode start time and AudioContext.currentTime.

**Rationale**:
- Already using Web Audio API for playback
- High precision timing available
- No additional polling needed with existing architecture

**Alternatives Considered**:
- HTMLAudioElement timeupdate event: Not using HTMLAudioElement
- setInterval polling: Adds unnecessary overhead
- requestAnimationFrame: Good for visual updates, need to sync with audio

**Implementation Notes**:
```typescript
interface PlaybackProgress {
  buttonId: string;
  elapsed: number;    // seconds
  duration: number;   // seconds
  progress: number;   // 0-1
}

// In playback service:
let startTime: number;
let duration: number;

function play(audioBuffer: AudioBuffer, buttonId: string) {
  startTime = audioContext.currentTime;
  duration = audioBuffer.duration;
  // ... existing playback code
}

function getProgress(): PlaybackProgress | null {
  if (!isPlaying) return null;
  const elapsed = audioContext.currentTime - startTime;
  return {
    buttonId: currentButtonId,
    elapsed,
    duration,
    progress: Math.min(elapsed / duration, 1)
  };
}
```

### 4. State Management: Extend useAudio Hook

**Decision**: Add playback state to existing useAudio hook, use React state for progress updates.

**Rationale**:
- Keeps audio logic centralized
- Minimal changes to existing component hierarchy
- Progress updates via callback from service layer

**Alternatives Considered**:
- Separate usePlaybackProgress hook: More modular but fragments audio state
- Context for playback state: Overkill for single-component consumption
- Event emitter pattern: More complex than needed

**Implementation Notes**:
```typescript
// Extended useAudio return type
interface UseAudioReturn {
  play: (audioBlob: Blob, buttonId: string) => Promise<void>;
  stop: () => void;
  playingButtonId: string | null;
  progress: number;  // 0-1, NEW
  isPlaying: boolean;
}
```

### 5. Reduced Motion Support

**Decision**: Use CSS media query prefers-reduced-motion with static visual alternative.

**Rationale**:
- Automatic detection of user preference
- No JavaScript needed for preference detection
- Static glow effect still provides feedback without motion

**Alternatives Considered**:
- JavaScript matchMedia polling: Unnecessary when CSS handles it
- User setting in app: Redundant with OS-level setting
- No alternative (just disable): Poor accessibility

**Implementation Notes**:
- Pulsing animation disabled, replaced with static glow
- Progress ring still updates (position change, not motion)
- Color contrast maintained in static state

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS @keyframes | Yes | Yes | Yes | Yes |
| SVG stroke-dashoffset | Yes | Yes | Yes | Yes |
| prefers-reduced-motion | Yes | Yes | Yes | Yes |
| Web Audio API timing | Yes | Yes | Yes | Yes |

All features fully supported in target browsers (latest 2 versions).

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Animation FPS | 60fps | Chrome DevTools |
| Progress Update Rate | 10Hz | Sufficient for smooth ring |
| CPU during playback | <5% | Profiler |
| Memory overhead | <1KB | Playback state object |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Animation jank on low-end devices | Poor UX | Use GPU-accelerated properties only (transform, opacity) |
| Progress ring not visible on small buttons | User confusion | Show only on buttons > 60px, or simplified indicator |
| Safari SVG rendering differences | Visual inconsistency | Test on real Safari, adjust stroke-linecap if needed |

## Open Questions (Resolved)

All technical questions resolved. Ready for Phase 1 design.
