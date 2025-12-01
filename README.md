# VisualTangibleNG

A Progressive Web App (PWA) for Augmentative and Alternative Communication (AAC). Designed for users who benefit from visual communication boards with customizable buttons, images, and audio feedback.

## Features

- **Communication Board**: Grid or freeform layout with customizable buttons
- **Audio Playback**: Tap buttons to play associated audio clips
- **Image Support**: Import and resize images for buttons (max 512px)
- **Audio Recording**: Record audio clips up to 30 seconds
- **Freeform Canvas**: Miro-like drag, resize, pan, and pinch-zoom
- **PIN Protection**: Secure edit mode with SHA-256 hashed PIN
- **Offline Support**: Full PWA with service worker caching
- **Accessibility**: 44px touch targets, ARIA labels, keyboard navigation

## Tech Stack

- React 18 + TypeScript 5.x
- Vite + vite-plugin-pwa
- IndexedDB (via idb library)
- Web Audio API
- MediaRecorder API
- Workbox (service worker)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── Board/          # Board display (grid & freeform canvas)
│   ├── Editor/         # Edit mode components
│   ├── PIN/            # PIN entry and setup
│   └── common/         # Shared components
├── hooks/              # Custom React hooks
├── services/           # Storage, audio services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
tests/
└── unit/               # Unit tests (Vitest)
```

## License

MIT
