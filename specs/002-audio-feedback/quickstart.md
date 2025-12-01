# Quickstart: Audio Playback Feedback

**Feature**: 002-audio-feedback
**Prerequisites**: 001-core-comm-board must be complete and working

## Overview

This feature adds visual feedback when audio plays on communication buttons:
1. **Pulse animation** - Button pulses while audio is playing
2. **Progress indicator** - Ring shows playback progress (optional)
3. **Reduced motion support** - Static glow for users who prefer no animation

## Implementation Steps

### Step 1: Extend Audio Playback Service

Modify `src/services/audio/playback.ts` to track playback progress:

```typescript
// Add state tracking
let currentButtonId: string | null = null;
let playbackStartTime: number = 0;
let playbackDuration: number = 0;
let progressCallback: ((progress: PlaybackProgress) => void) | null = null;
let animationFrameId: number | null = null;

// Modify play function to accept buttonId and callback
export async function play(
  audioBlob: Blob,
  buttonId: string,
  onProgress?: (progress: PlaybackProgress) => void
): Promise<void> {
  // ... existing decode logic ...

  currentButtonId = buttonId;
  playbackStartTime = audioContext.currentTime;
  playbackDuration = audioBuffer.duration;
  progressCallback = onProgress || null;

  // Start progress tracking
  if (progressCallback) {
    startProgressTracking();
  }

  // ... existing playback logic ...
}

function startProgressTracking() {
  const tick = () => {
    if (!currentButtonId || !progressCallback) return;

    const elapsed = audioContext.currentTime - playbackStartTime;
    const progress = Math.min(elapsed / playbackDuration, 1);

    progressCallback({
      buttonId: currentButtonId,
      elapsed,
      duration: playbackDuration,
      progress,
    });

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(tick);
    }
  };

  animationFrameId = requestAnimationFrame(tick);
}
```

### Step 2: Extend useAudio Hook

Modify `src/hooks/useAudio.ts` to expose playback state:

```typescript
export function useAudio(): UseAudioWithFeedbackReturn {
  const [playingButtonId, setPlayingButtonId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleProgress = useCallback((p: PlaybackProgress) => {
    setProgress(p.progress);
    setElapsed(p.elapsed);
    setDuration(p.duration);
  }, []);

  const play = useCallback(async (audioBlob: Blob, buttonId: string) => {
    setPlayingButtonId(buttonId);
    setProgress(0);

    try {
      await playbackService.play(audioBlob, buttonId, handleProgress);
    } finally {
      setPlayingButtonId(null);
      setProgress(0);
    }
  }, [handleProgress]);

  // ... rest of hook
}
```

### Step 3: Add CSS Animations

Add to `src/components/Board/BoardButton.css`:

```css
/* Pulse animation for playing state */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

.board-button.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

/* Reduced motion: static glow instead of pulse */
@media (prefers-reduced-motion: reduce) {
  .board-button.playing {
    animation: none;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6);
  }
}

/* Progress ring container */
.progress-ring {
  position: absolute;
  inset: -4px;
  pointer-events: none;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring circle {
  fill: none;
  stroke-width: 3;
}

.progress-ring .bg {
  stroke: rgba(0, 0, 0, 0.1);
}

.progress-ring .fg {
  stroke: var(--color-accent, #3b82f6);
  transition: stroke-dashoffset 100ms linear;
}
```

### Step 4: Update BoardButton Component

Modify `src/components/Board/BoardButton.tsx`:

```tsx
interface BoardButtonProps {
  button: Button;
  onTap: () => void;
  isPlaying?: boolean;
  progress?: number;
}

export function BoardButton({
  button,
  onTap,
  isPlaying = false,
  progress = 0,
}: BoardButtonProps) {
  const circumference = 2 * Math.PI * 45; // radius 45 for viewBox 100
  const offset = circumference * (1 - progress);

  return (
    <button
      className={`board-button ${isPlaying ? 'playing' : ''}`}
      onClick={onTap}
      aria-label={button.label || 'Communication button'}
      aria-pressed={isPlaying}
    >
      {/* Existing image content */}
      {button.imageId && <img src={...} alt="" />}

      {/* Progress ring - only show when playing */}
      {isPlaying && (
        <div className="progress-ring" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className="bg" cx="50" cy="50" r="45" />
            <circle
              className="fg"
              cx="50"
              cy="50"
              r="45"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
        </div>
      )}
    </button>
  );
}
```

### Step 5: Connect in Board Component

Pass playback state from useAudio to BoardButton:

```tsx
function Board() {
  const { playingButtonId, progress, play } = useAudio();

  return (
    <div className="board" role="grid">
      {buttons.map((button) => (
        <BoardButton
          key={button.id}
          button={button}
          isPlaying={playingButtonId === button.id}
          progress={playingButtonId === button.id ? progress : 0}
          onTap={() => handleButtonTap(button)}
        />
      ))}
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
// tests/unit/audio-feedback.test.ts
describe('PlaybackProgress', () => {
  it('should calculate progress correctly', () => {
    const progress = calculateProgress(5, 10); // 5s elapsed, 10s duration
    expect(progress).toBe(0.5);
  });

  it('should clamp progress to 1', () => {
    const progress = calculateProgress(15, 10); // elapsed > duration
    expect(progress).toBe(1);
  });
});
```

### Integration Tests

```typescript
// tests/integration/button-feedback.test.tsx
it('should show playing state when audio plays', async () => {
  render(<Board buttons={mockButtons} />);

  const button = screen.getByRole('button', { name: /water/i });
  await userEvent.click(button);

  expect(button).toHaveClass('playing');
  expect(button).toHaveAttribute('aria-pressed', 'true');
});
```

## Verification Checklist

- [ ] Pulse animation appears when button audio plays
- [ ] Animation stops when audio completes
- [ ] Only one button shows playing state at a time
- [ ] Progress ring fills as audio plays
- [ ] Reduced motion shows static glow instead
- [ ] Animation maintains 60fps (check DevTools)
- [ ] Works in Chrome, Firefox, Safari, Edge
