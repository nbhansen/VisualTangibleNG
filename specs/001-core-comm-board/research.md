# Research: Core Communication Board

**Feature**: 001-core-comm-board
**Date**: 2025-12-01

## Technology Decisions

### 1. Frontend Framework: React 18 + TypeScript

**Decision**: Use React 18 with TypeScript and Vite as the build tool.

**Rationale**:
- React has excellent PWA support via Vite plugins
- TypeScript provides type safety for complex state (board/button data)
- Large ecosystem for accessibility components
- Vite offers fast development experience and optimized production builds
- React's concurrent features help maintain 60fps during audio operations

**Alternatives Considered**:
- Vue 3: Similar capabilities, smaller ecosystem for AAC-specific components
- Svelte: Smaller bundle size but less mature PWA tooling
- Vanilla JS: Lower complexity but harder to maintain component state

### 2. Local Storage: IndexedDB via idb library

**Decision**: Use IndexedDB with the `idb` wrapper library for all persistent data.

**Rationale**:
- IndexedDB supports large binary data (images, audio blobs)
- Works fully offline
- `idb` provides Promise-based API over callback-based IndexedDB
- No storage limits like localStorage (5MB)
- Supports structured data with indexes for fast queries

**Alternatives Considered**:
- localStorage: 5MB limit, no binary support - unsuitable for audio/images
- File System Access API: Limited browser support, more complex
- SQLite via sql.js: Overkill for simple key-value with blobs

### 3. Audio Recording: MediaRecorder API

**Decision**: Use the native MediaRecorder API for audio capture.

**Rationale**:
- Native browser API, no dependencies
- Supports WebM/Opus format (good compression, wide support)
- Can set bitrate for reasonable file sizes
- Works offline

**Alternatives Considered**:
- RecordRTC library: More features but unnecessary complexity
- Web Audio API only: Would require manual encoding

**Implementation Notes**:
- Format: WebM with Opus codec (audio/webm;codecs=opus)
- Sample rate: 48kHz (browser default)
- Target file size: ~30KB for 30 seconds at 8kbps

### 4. Audio Playback: Web Audio API

**Decision**: Use Web Audio API for low-latency playback.

**Rationale**:
- Sub-100ms latency possible with proper buffering
- Can pre-decode audio for instant playback
- Provides gain control for consistent volume
- Native, no dependencies

**Alternatives Considered**:
- HTMLAudioElement: Higher latency, less control
- Howler.js: Adds abstraction but no significant benefit for our use case

**Implementation Notes**:
- Pre-decode audio on board load for instant playback
- Use AudioContext.decodeAudioData() for each button's audio
- Keep decoded AudioBuffers in memory for active buttons

### 5. Image Handling: Canvas API for Resize

**Decision**: Use Canvas API to resize imported images client-side.

**Rationale**:
- Native browser API
- Can resize to reasonable dimensions (e.g., 512x512 max)
- Outputs to Blob for IndexedDB storage
- Preserves aspect ratio

**Alternatives Considered**:
- No resize: Risk of huge image files filling storage
- Sharp/ImageMagick: Server-side only, violates offline-first

**Implementation Notes**:
- Max dimension: 512px (width or height)
- Output format: WebP if supported, fallback to JPEG
- Quality: 0.8 for good balance of size/quality

### 6. PWA Service Worker: Workbox

**Decision**: Use Workbox via vite-plugin-pwa for service worker generation.

**Rationale**:
- Industry standard for PWA service workers
- Automatic precaching of app shell
- Runtime caching strategies out of the box
- Handles updates gracefully

**Alternatives Considered**:
- Manual service worker: More control but significant boilerplate
- No service worker: Would not meet offline-first requirement

**Implementation Notes**:
- Strategy: Precache all app assets
- No runtime network caching needed (no API calls)
- Cache version tied to build hash

### 7. State Management: React Context + useReducer

**Decision**: Use React Context with useReducer for global state, no external library.

**Rationale**:
- Simple app state (one board, edit mode flag, PIN state)
- No need for Redux/Zustand complexity
- Keeps dependencies minimal per constitution
- Easy to test

**Alternatives Considered**:
- Redux: Overkill for single-board app
- Zustand: Nice but unnecessary dependency
- Jotai/Recoil: Atomic state not needed here

### 8. Testing Strategy

**Decision**: Three-tier testing approach.

**Rationale**:
- Unit tests (Vitest): Fast feedback on business logic
- Integration tests (React Testing Library): Component behavior
- E2E tests (Playwright): Critical user flows

**Test Coverage Priorities**:
1. Audio playback on button tap (P1 feature)
2. IndexedDB persistence across reloads
3. PIN protection flow
4. Image import and resize
5. Audio recording with 30s limit

### 9. Accessibility Implementation

**Decision**: Use semantic HTML + ARIA + focus management.

**Rationale**:
- Semantic HTML provides baseline accessibility
- ARIA labels for dynamic content
- Focus trap in edit mode dialogs
- Visible focus indicators

**Implementation Notes**:
- Buttons use `<button>` elements (not divs)
- Grid uses `role="grid"` with `role="gridcell"` children
- Recording state announced via `aria-live` region
- PIN input uses `inputmode="numeric"` for mobile keyboards

### 10. PIN Storage

**Decision**: Store PIN hash in IndexedDB, not plaintext.

**Rationale**:
- Security best practice even for local storage
- Use SubtleCrypto API for hashing (SHA-256)
- No need for external crypto library

**Implementation Notes**:
- Hash PIN with SHA-256 via `crypto.subtle.digest()`
- Store hash as hex string
- Compare hashes on entry
- Reset clears hash (per edge case requirement)

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | Yes | Yes | Yes | Yes |
| MediaRecorder | Yes | Yes | Yes (14.3+) | Yes |
| Web Audio API | Yes | Yes | Yes | Yes |
| Service Worker | Yes | Yes | Yes | Yes |
| File input accept | Yes | Yes | Yes | Yes |

**Minimum Versions**: Latest 2 versions of each browser (per constitution).

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | <2s | Lighthouse |
| Audio Playback Latency | <300ms | Manual testing |
| Button Tap Response | <100ms | React Profiler |
| Bundle Size (gzipped) | <200KB | Build output |
| IndexedDB Read | <50ms | Performance API |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Safari MediaRecorder quirks | Audio recording may fail | Test on real Safari, provide fallback messaging |
| Large images filling storage | App becomes unusable | Resize all images to max 512px |
| Audio decode time on slow devices | Delayed playback | Pre-decode on board load, show loading state |
| PIN brute force | Unauthorized edit access | No lockout needed (local device, physical access assumed) |

## Deployment Strategy

### Decision: PWA First, Capacitor Later

**Decision**: Build as PWA for MVP, add Capacitor wrapper for app stores post-validation.

**Rationale**:
- Fastest path to working product
- PWA works on all platforms immediately
- Same React codebase wraps cleanly with Capacitor
- No app store fees/delays during development
- Easy to share and test via URL

**Alternatives Considered**:
- React Native: Would require different codebase, no web version
- Flutter: Best performance but Dart language, steeper learning curve
- Capacitor from day 1: Adds complexity before it's needed

**Migration to Capacitor (when needed)**:
1. Install Capacitor CLI and core
2. Add iOS and Android platforms
3. Configure native plugins if needed (audio, camera)
4. Build and submit to app stores

**Performance considerations**:
- React on low-end devices: Monitor, consider Preact if issues arise
- Safari/iOS audio: Test early, may need Capacitor audio plugin
- IndexedDB on Safari: Known to be slower, acceptable for MVP scale

## Open Questions (Resolved)

All technical questions resolved. Ready for Phase 1 design.
