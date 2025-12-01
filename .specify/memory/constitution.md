<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Modified principles: None
Added sections:
  - Principle VII: Pluggable AI Services
  - AI Provider Architecture (in Technology Constraints)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: no changes needed
  - .specify/templates/spec-template.md: no changes needed
  - .specify/templates/tasks-template.md: no changes needed
Follow-up TODOs: None
-->

# VisualTangibleNG Constitution

## Core Principles

### I. Offline-First PWA

All functionality MUST work without an internet connection. The application MUST be installable
as a Progressive Web App on mobile and desktop devices. Network requests are permitted only for
optional features (e.g., cloud backup, AI generation) and MUST degrade gracefully when offline.

**Rationale**: Children and caregivers use communication aids in varied environments—hospitals,
schools, parks—where connectivity is unreliable. Communication cannot depend on WiFi.

### II. Local Data Ownership

All user data (boards, images, audio) MUST be stored locally on the device by default. Data
format MUST be open and documented (JSON + standard media formats). Users MUST be able to
export their complete data as a single portable file and import it on another device without
loss. No server-side storage is required for core functionality.

**Rationale**: Parents and therapists invest significant time creating personalized boards.
They must own and control that data without vendor lock-in or subscription dependencies.

### III. Accessibility-First

The application MUST support:
- Switch scanning (single/dual switch access)
- Screen reader compatibility (ARIA labels, semantic HTML)
- High contrast and large text modes
- Keyboard-only navigation
- Touch targets minimum 44x44px

Accessibility is not an afterthought—features that cannot be made accessible MUST NOT ship.

**Rationale**: AAC users often have motor, visual, or cognitive differences. The app exists
to remove communication barriers, not create new ones.

### IV. Zero-Friction Editing

Creating and editing communication boards MUST require no technical skills. Core interactions:
- Drag-and-drop image placement
- One-tap audio recording OR AI voice generation
- Visual grid layout selection (1, 2, 4, 9, 16, 25, 36 buttons)
- No mandatory text input (images + audio sufficient)
- Optional AI image generation from text descriptions

The edit-to-use cycle MUST be under 30 seconds for adding a single new button.

**Rationale**: Caregivers are busy. Complex editing tools get abandoned. Simplicity drives
adoption and consistent use.

### V. Privacy & Child Safety

The application MUST NOT:
- Require account creation for core functionality
- Collect analytics or telemetry without explicit opt-in
- Include advertisements
- Make network requests that leak user content without consent

AI features that send data to external services MUST:
- Clearly disclose what data is transmitted
- Require explicit user action (not automatic)
- Never transmit personally identifiable information about the child

All optional cloud features MUST be clearly disclosed and consent-based.

**Rationale**: Users include vulnerable children. COPPA compliance and ethical data handling
are non-negotiable, not features.

### VI. Open Source Community

The project uses a permissive open-source license (MIT). Contributions are welcome.
Documentation MUST be sufficient for new contributors to onboard within one session.
Dependencies MUST be minimal and well-maintained.

**Rationale**: Proprietary AAC apps cost $100-300+. Open source ensures this tool remains
free and improvable by the community that needs it.

### VII. Pluggable AI Services

AI capabilities (voice synthesis, image generation) MUST be implemented behind a provider
abstraction layer. The application MUST support:
- Multiple AI providers for each capability (e.g., OpenAI, ElevenLabs, local models)
- User-configurable provider selection
- Bring-your-own-API-key model (no vendor lock-in)
- Graceful fallback when AI unavailable (manual recording, image upload still work)

Provider implementations MUST be isolated modules that conform to a defined interface.
Adding a new provider MUST NOT require changes to core application code.

**Rationale**: AI services evolve rapidly. Users have different preferences, budgets, and
privacy requirements. A pluggable architecture ensures longevity and user choice.

## Technology Constraints

### Core Platform
- **Platform**: Progressive Web App (PWA) with service worker for offline support
- **Frontend**: Modern JavaScript/TypeScript framework (decision deferred to implementation)
- **Storage**: IndexedDB for structured data, Cache API for assets
- **Audio**: Web Audio API + MediaRecorder API
- **Export Format**: ZIP containing JSON manifest + media files
- **No Backend Required**: All core features work client-side only
- **Browser Support**: Latest 2 versions of Chrome, Firefox, Safari, Edge

### AI Provider Architecture
- **Abstraction**: All AI services accessed via provider interfaces (not direct SDK calls)
- **Voice Synthesis Interface**: `generateSpeech(text, voice, options) → AudioBlob`
- **Image Generation Interface**: `generateImage(prompt, style, options) → ImageBlob`
- **Provider Registry**: Runtime-configurable mapping of capability → provider
- **API Key Storage**: User API keys stored locally (encrypted), never transmitted to our servers
- **Supported Provider Types**:
  - Cloud APIs (OpenAI, ElevenLabs, Anthropic, Google, etc.)
  - Self-hosted endpoints (LocalAI, Ollama, etc.)
  - Browser-native (Web Speech API as fallback TTS)

## Development Workflow

- **Testing**: All user-facing features MUST have automated tests before merge
- **Accessibility Audit**: New UI components MUST pass axe-core checks
- **Documentation**: Public APIs and data formats MUST be documented
- **Code Review**: All changes require review before merge to main branch
- **Semantic Versioning**: MAJOR.MINOR.PATCH for releases
- **Provider Isolation**: AI provider implementations MUST be in separate modules

## Governance

This constitution is the authoritative source for project principles and constraints. All
design decisions, pull requests, and feature proposals MUST align with these principles.

**Amendment Process**:
1. Propose change via GitHub issue with rationale
2. Community discussion period (minimum 7 days)
3. Maintainer approval required
4. Update constitution version and Last Amended date

**Compliance**: Reviewers MUST verify constitutional alignment during code review. Features
violating core principles MUST be rejected or redesigned.

**Version**: 1.1.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
