# Research: Button Text Labels

**Feature**: 003-button-text
**Date**: 2025-12-01

## Technology Decisions

### 1. Typography: System Font Stack

**Decision**: Use system font stack for labels (no custom fonts).

**Rationale**:
- No additional font loading = faster render, smaller bundle
- System fonts are optimized for each platform
- Familiar to users of that platform
- Better accessibility (user font preferences respected)

**Alternatives Considered**:
- Google Fonts (Open Sans, Roboto): Adds network dependency, larger bundle
- Self-hosted fonts: Increases PWA cache size
- Variable fonts: Overkill for simple labels

**Implementation Notes**:
```css
.button-label {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-weight: 500;
}
```

### 2. Responsive Font Sizing: CSS clamp()

**Decision**: Use CSS `clamp()` for responsive font sizing based on button size.

**Rationale**:
- Single declaration handles all viewport sizes
- No JavaScript calculation needed
- Smooth scaling between min and max sizes
- Supported in all target browsers

**Alternatives Considered**:
- Media queries: Multiple breakpoints, more complex CSS
- JavaScript resize observer: Unnecessary complexity, performance overhead
- Fixed sizes per layout: Inflexible, edge cases

**Implementation Notes**:
```css
.button-label {
  /* Min 10px, preferred 3% of button width, max 16px */
  font-size: clamp(10px, 3vmin, 16px);
}

/* Larger labels for 1-2 button layouts */
.board[data-layout="1"] .button-label,
.board[data-layout="2"] .button-label {
  font-size: clamp(14px, 4vmin, 24px);
}
```

### 3. Text Overflow: CSS text-overflow with line-clamp

**Decision**: Use `text-overflow: ellipsis` with `-webkit-line-clamp` for multi-line truncation.

**Rationale**:
- Native CSS solution, no JavaScript
- Graceful truncation with visual indicator (ellipsis)
- Works with flexible container heights

**Alternatives Considered**:
- JavaScript truncation: Unnecessary complexity
- Single line only: Wastes vertical space
- No truncation (scroll): Poor UX on small buttons

**Implementation Notes**:
```css
.button-label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
```

### 4. Label Position: CSS Flexbox Direction

**Decision**: Use flexbox with `flex-direction` to position label above or below image.

**Rationale**:
- Simple CSS change to swap positions
- Maintains consistent spacing
- Easy to animate position changes if desired

**Alternatives Considered**:
- CSS Grid with order: More complex for simple two-item layout
- Absolute positioning: Harder to maintain consistent spacing
- Separate components: Unnecessary code duplication

**Implementation Notes**:
```css
.board-button {
  display: flex;
  flex-direction: column;
}

.board-button[data-label-position="above"] {
  flex-direction: column-reverse;
}

.board-button[data-label-position="hidden"] .button-label {
  display: none;
}
```

### 5. Contrast Compliance: CSS Custom Properties

**Decision**: Use CSS custom properties for label colors with high-contrast variants.

**Rationale**:
- Easy to maintain consistent contrast ratios
- Supports theming and dark mode
- Can be audited with axe-core

**Alternatives Considered**:
- Hardcoded colors: Inflexible, harder to maintain
- JavaScript contrast calculation: Overkill for known color pairs

**Implementation Notes**:
```css
:root {
  --label-color: #1f2937;      /* gray-800, 12.6:1 on white */
  --label-bg: rgba(255, 255, 255, 0.9);
}

@media (prefers-color-scheme: dark) {
  :root {
    --label-color: #f3f4f6;    /* gray-100, 14.4:1 on gray-900 */
    --label-bg: rgba(17, 24, 39, 0.9);
  }
}

.high-contrast {
  --label-color: #000000;
  --label-bg: #ffffff;
}
```

### 6. Database Migration: IndexedDB Version Bump

**Decision**: Increment IndexedDB version, add label field with null default.

**Rationale**:
- Clean migration path
- Existing buttons get null label (no visual change)
- No data loss

**Alternatives Considered**:
- Separate label store: Unnecessary complexity
- JSON field: Harder to query/index

**Implementation Notes**:
```typescript
// db.ts - version 1 → 2 migration
const DB_VERSION = 2;

function upgradeDB(db: IDBPDatabase, oldVersion: number) {
  if (oldVersion < 2) {
    // Button.label field added (null by default)
    // Board.labelPosition field added ('below' by default)
    // No schema changes needed - just type updates
    // Existing records automatically have undefined which we treat as null
  }
}
```

### 7. Input Validation: Max Length with Counter

**Decision**: Limit labels to 50 characters with visible counter.

**Rationale**:
- 50 chars sufficient for most words/phrases
- Counter helps users know limit before hitting it
- Truncation handled gracefully in display

**Alternatives Considered**:
- No limit: Risk of very long text breaking layout
- Hard block on input: Poor UX
- Server-side validation: No server

**Implementation Notes**:
```tsx
<input
  type="text"
  maxLength={50}
  value={label}
  onChange={(e) => setLabel(e.target.value)}
  placeholder="Add label (optional)"
/>
<span className="char-count">{label.length}/50</span>
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS clamp() | 79+ | 75+ | 13.1+ | 79+ |
| -webkit-line-clamp | Yes | 68+ | Yes | Yes |
| CSS custom properties | Yes | Yes | Yes | Yes |
| flexbox | Yes | Yes | Yes | Yes |

All features fully supported in target browsers (latest 2 versions).

## Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Label render | <16ms | No layout shift |
| Font load | 0ms | System fonts, no load |
| Input responsiveness | <50ms | Instant feedback |
| Storage overhead | ~50 bytes/label | Negligible |

## Accessibility Checklist

- [ ] Labels visible at 200% zoom
- [ ] Contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Labels read by screen readers (part of button accessible name)
- [ ] Font scales with user preferences
- [ ] High contrast mode supported

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long labels breaking layout | Visual issues | Line clamp + ellipsis |
| Font rendering differences | Inconsistent appearance | System fonts, acceptable variance |
| RTL language support | Reversed layout | Use dir="auto" on label element |

## Open Questions (Resolved)

All technical questions resolved. Ready for Phase 1 design.
