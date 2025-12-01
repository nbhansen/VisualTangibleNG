# Quickstart: Core Communication Board

**Feature**: 001-core-comm-board
**Date**: 2025-12-01

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Modern browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

## Project Setup

### 1. Initialize Project

```bash
# Create Vite project with React + TypeScript
npm create vite@latest visual-tangible-ng -- --template react-ts
cd visual-tangible-ng

# Install dependencies
npm install

# Install additional dependencies
npm install idb uuid
npm install -D @types/uuid vite-plugin-pwa workbox-window
```

### 2. Configure Vite for PWA

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Visual Tangible NG',
        short_name: 'VT-NG',
        description: 'Communication board for AAC users',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
```

### 3. Project Structure

```bash
# Create directory structure
mkdir -p src/{components,hooks,services,types,utils}
mkdir -p src/components/{Board,Editor,PIN,common}
mkdir -p src/services/{storage,audio,image}
mkdir -p tests/{unit,integration,e2e}
```

### 4. Configure Testing

```bash
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
npx playwright install
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.tsx'],
  },
});
```

## Development Workflow

### Start Development Server

```bash
npm run dev
# Opens at http://localhost:5173
```

### Run Tests

```bash
# Unit and integration tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

### Build for Production

```bash
npm run build
# Output in dist/

# Preview production build
npm run preview
```

## Key Implementation Steps

### Step 1: Storage Service

Implement IndexedDB storage using the `idb` library:

```typescript
// src/services/storage/index.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { AppState, Board, Button, Image, Audio } from '../../types';

interface VisualTangibleDB extends DBSchema {
  appState: { key: string; value: AppState };
  boards: { key: string; value: Board };
  buttons: { key: string; value: Button; indexes: { 'by-board': string } };
  images: { key: string; value: Image; indexes: { 'by-button': string } };
  audio: { key: string; value: Audio; indexes: { 'by-button': string } };
}

const DB_NAME = 'visual-tangible-ng';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<VisualTangibleDB>> {
  return openDB<VisualTangibleDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      db.createObjectStore('appState', { keyPath: 'id' });
      db.createObjectStore('boards', { keyPath: 'id' });

      const buttons = db.createObjectStore('buttons', { keyPath: 'id' });
      buttons.createIndex('by-board', 'boardId');

      const images = db.createObjectStore('images', { keyPath: 'id' });
      images.createIndex('by-button', 'buttonId');

      const audio = db.createObjectStore('audio', { keyPath: 'id' });
      audio.createIndex('by-button', 'buttonId');
    },
  });
}
```

### Step 2: Audio Service

Implement audio playback and recording:

```typescript
// src/services/audio/playback.ts
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function initAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function decodeAudio(blob: Blob): Promise<AudioBuffer> {
  const ctx = initAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

export function playBuffer(buffer: AudioBuffer): void {
  const ctx = initAudioContext();

  // Stop any current playback
  if (currentSource) {
    currentSource.stop();
  }

  currentSource = ctx.createBufferSource();
  currentSource.buffer = buffer;
  currentSource.connect(ctx.destination);
  currentSource.start();
}
```

### Step 3: Board Component

Create the main board grid:

```tsx
// src/components/Board/Board.tsx
import type { ButtonWithMedia, GridLayout } from '../../types';
import { GRID_ARRANGEMENTS } from '../../types';
import { BoardButton } from './BoardButton';

interface BoardProps {
  buttons: ButtonWithMedia[];
  layout: GridLayout;
  onButtonTap: (button: ButtonWithMedia) => void;
}

export function Board({ buttons, layout, onButtonTap }: BoardProps) {
  const [rows, cols] = GRID_ARRANGEMENTS[layout];
  const visibleButtons = buttons.slice(0, layout);

  return (
    <div
      role="grid"
      className="board-grid"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '8px',
        padding: '16px',
        height: '100%',
      }}
    >
      {visibleButtons.map((button) => (
        <BoardButton
          key={button.id}
          button={button}
          onTap={() => onButtonTap(button)}
        />
      ))}
    </div>
  );
}
```

### Step 4: PIN Entry

Implement PIN protection:

```tsx
// src/components/PIN/PINEntry.tsx
import { useState } from 'react';
import { isValidPin } from '../../services/pin';

interface PINEntryProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

export function PINEntry({ onSubmit, onCancel, error }: PINEntryProps) {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPin(pin)) {
      onSubmit(pin);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pin-entry">
      <label htmlFor="pin-input">Enter PIN</label>
      <input
        id="pin-input"
        type="password"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        autoFocus
      />
      {error && <p className="error">{error}</p>}
      <div className="buttons">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={!isValidPin(pin)}>Enter</button>
      </div>
    </form>
  );
}
```

## Validation Checklist

After implementation, verify:

- [ ] App loads in under 2 seconds
- [ ] Buttons display correctly in all layouts (1, 2, 4, 9, 16)
- [ ] Tapping button plays audio within 300ms
- [ ] Audio recording stops at 30 seconds
- [ ] Images resize to max 512px
- [ ] Data persists after app restart
- [ ] App works fully offline
- [ ] PIN protects edit mode
- [ ] Touch targets are at least 44x44px
- [ ] App installs as PWA

## Troubleshooting

### Audio doesn't play on first tap
- Web Audio API requires user interaction to start
- Ensure AudioContext is created on first tap, not on page load

### IndexedDB quota exceeded
- Check image sizes (should be <500KB each)
- Check audio sizes (should be <100KB each)
- Provide storage warning UI

### Service worker not updating
- Clear site data in DevTools
- Unregister service worker and reload
- Check Workbox configuration

### MediaRecorder not supported
- Safari requires macOS 14.2+ or iOS 14.3+
- Provide fallback message for unsupported browsers

## Next Steps

After MVP is complete:
1. Add export/import functionality
2. Add multiple boards support
3. Integrate AI voice generation (per constitution Principle VII)
4. Add switch scanning for accessibility
