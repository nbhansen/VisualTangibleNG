# Feature Specification: Button Text Labels

**Feature Branch**: `003-button-text`
**Created**: 2025-12-01
**Status**: Draft
**Input**: User description: "Add text labels to buttons - display text under or over button images to help users who can read"
**Depends On**: 001-core-comm-board (must be complete)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display Text Labels on Buttons (Priority: P1)

A child or AAC user who can read sees text labels on buttons alongside images. This provides dual-coding (visual + text) which aids comprehension and supports literacy development.

**Why this priority**: Core feature - text labels add significant value for users with emerging literacy skills and help caregivers quickly identify buttons.

**Independent Test**: Open board with buttons that have labels configured. Verify text appears below each button image.

**Acceptance Scenarios**:

1. **Given** a button has a text label configured, **When** viewing the board, **Then** the label is displayed below the button image
2. **Given** a button has no text label, **When** viewing the board, **Then** no text area is shown (image fills space)
3. **Given** a label is longer than the button width, **When** displayed, **Then** text is truncated with ellipsis or wraps to 2 lines max
4. **Given** high contrast mode is enabled, **When** viewing labels, **Then** text meets WCAG AA contrast ratio (4.5:1)

---

### User Story 2 - Add/Edit Text Labels in Edit Mode (Priority: P1)

A caregiver adds or edits text labels for buttons in edit mode. This is done through a simple text input field when editing a button.

**Why this priority**: Equal priority to display - users need to be able to set labels for the feature to be useful.

**Independent Test**: Enter edit mode, select button, add text label, exit edit mode. Verify label appears on button.

**Acceptance Scenarios**:

1. **Given** user is editing a button, **When** they view the button editor, **Then** they see a text input field for the label
2. **Given** user enters text in the label field, **When** they save, **Then** the label is persisted to storage
3. **Given** a button has an existing label, **When** user clears the text field and saves, **Then** the label is removed
4. **Given** user enters a very long label (>50 chars), **When** they save, **Then** text is truncated to 50 characters

---

### User Story 3 - Configure Label Position (Priority: P3)

A caregiver can choose whether labels appear above or below images, or are hidden entirely. This is a board-level setting.

**Why this priority**: Nice-to-have customization - most users will be fine with default (below image).

**Independent Test**: Change label position setting, verify all buttons update to show labels in new position.

**Acceptance Scenarios**:

1. **Given** user is in edit mode settings, **When** they view options, **Then** they see label position choices (below, above, hidden)
2. **Given** label position is set to "above", **When** viewing board, **Then** all labels appear above images
3. **Given** label position is set to "hidden", **When** viewing board, **Then** no labels are shown (even if configured)

---

### Edge Cases

- What happens with very small grid layouts (1-2 buttons)? Labels may be larger and more prominent.
- What happens with special characters or emoji in labels? They are displayed as-is if supported by system font.
- What happens with RTL languages? Text direction follows browser/system RTL settings.
- What happens if font fails to load? System fallback font is used.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display text labels below button images by default
- **FR-002**: System MUST allow caregivers to add/edit labels in edit mode
- **FR-003**: System MUST persist labels to IndexedDB with button data
- **FR-004**: System MUST truncate labels that exceed button width
- **FR-005**: System MUST support labels up to 50 characters
- **FR-006**: System SHOULD allow configuring label position (above, below, hidden)
- **FR-007**: System MUST ensure label text meets WCAG AA contrast requirements
- **FR-008**: System MUST scale label font size appropriately for grid layout

### Key Entities

- **Button** (extended): Add `label: string | null` field
- **Board** (extended): Add `labelPosition: 'above' | 'below' | 'hidden'` field (default: 'below')

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Labels are readable at all supported grid sizes (1-16 buttons)
- **SC-002**: Adding a label takes under 10 seconds (open editor, type, save)
- **SC-003**: Label text passes WCAG AA contrast ratio in all themes
- **SC-004**: Labels render correctly across Chrome, Firefox, Safari, Edge
