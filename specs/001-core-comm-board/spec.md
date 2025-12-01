# Feature Specification: Core Communication Board

**Feature Branch**: `001-core-comm-board`
**Created**: 2025-12-01
**Status**: Draft
**Input**: User description: "a basic communication board, CORE MVP a grid of buttons with images that can be imported + audio playback maybe just by recording a sound"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Communication Button (Priority: P1)

A child or AAC user taps a button on the communication board, and the associated audio plays immediately. This is the core interaction that enables non-verbal communication.

**Why this priority**: This is the fundamental use case - without audio playback on tap, the app has no value. Everything else builds on this.

**Independent Test**: Can be fully tested by loading a pre-configured board with buttons and tapping them. Delivers immediate communication value.

**Acceptance Scenarios**:

1. **Given** a board is displayed with buttons containing images and audio, **When** the user taps a button, **Then** the associated audio plays immediately (within 300ms perceived delay)
2. **Given** audio is currently playing from one button, **When** the user taps a different button, **Then** the first audio stops and the new audio plays
3. **Given** a button has an image but no audio, **When** the user taps the button, **Then** no audio plays and no error is shown to the user

---

### User Story 2 - View Communication Board (Priority: P1)

A caregiver or child opens the app and sees a grid of communication buttons. The grid layout is clear, buttons are large enough to tap easily, and images are visible.

**Why this priority**: Users must be able to see and understand the board before they can interact with it. This is foundational alongside playback.

**Independent Test**: Can be tested by opening the app and verifying the grid displays correctly with sample content.

**Acceptance Scenarios**:

1. **Given** the app is opened, **When** the board loads, **Then** a grid of buttons is displayed with visible images
2. **Given** a board has 4 buttons configured, **When** viewing the board, **Then** the buttons are arranged in a 2x2 grid layout
3. **Given** a board has 9 buttons configured, **When** viewing the board, **Then** the buttons are arranged in a 3x3 grid layout
4. **Given** the device is a tablet or phone, **When** viewing the board, **Then** buttons are at least 44x44 pixels (accessibility minimum)

---

### User Story 3 - Add Image to Button (Priority: P2)

A caregiver creates or edits a button by importing an image from their device's photo library or camera. The image becomes the visual representation of that communication option.

**Why this priority**: Without the ability to add images, caregivers cannot customize boards for their child's specific needs. This enables personalization.

**Independent Test**: Can be tested by selecting an empty button, importing an image, and verifying it appears on the button.

**Acceptance Scenarios**:

1. **Given** the user is in edit mode, **When** they tap an empty button, **Then** they see an option to add an image
2. **Given** the image picker is open, **When** the user selects a photo from their device, **Then** the image is added to the button and displayed
3. **Given** a button already has an image, **When** the user chooses to replace it, **Then** the new image replaces the old one
4. **Given** the user selects a very large image, **When** it is added to the button, **Then** the image is automatically resized to fit the button while maintaining aspect ratio

---

### User Story 4 - Record Audio for Button (Priority: P2)

A caregiver records audio using the device microphone to associate a spoken word or phrase with a button. This allows personalized voice recordings (e.g., parent's voice saying "I want water").

**Why this priority**: Recorded audio enables personalization with familiar voices, which is more engaging for children than synthesized speech.

**Independent Test**: Can be tested by selecting a button, recording audio, and then tapping the button to hear the recording play back.

**Acceptance Scenarios**:

1. **Given** the user is in edit mode with a button selected, **When** they tap "Record Audio", **Then** the device microphone begins recording with a visible timer
2. **Given** recording is in progress, **When** the user taps "Stop", **Then** the recording ends and is saved to the button
3. **Given** a recording has been made, **When** the user taps "Preview", **Then** they hear the recorded audio before saving
4. **Given** a button already has audio, **When** the user records new audio, **Then** the new recording replaces the old one
5. **Given** recording reaches 30 seconds, **When** the timer expires, **Then** recording automatically stops and saves

---

### User Story 5 - Configure Grid Layout (Priority: P3)

A caregiver chooses how many buttons appear on the board by selecting a grid layout (e.g., 1, 2, 4, 9, 16 buttons). This allows adaptation to the user's cognitive and motor abilities.

**Why this priority**: Different users need different complexity levels. A child just starting may need only 2-4 buttons, while an advanced user may want 16+.

**Independent Test**: Can be tested by accessing settings, changing grid size, and verifying the board updates to show the correct number of buttons.

**Acceptance Scenarios**:

1. **Given** the user is in settings/edit mode, **When** they select "Grid Layout", **Then** they see options for 1, 2, 4, 9, 16 buttons
2. **Given** a grid layout is selected, **When** the board is viewed, **Then** the correct number of buttons is displayed in the appropriate arrangement
3. **Given** a board has content in 9 buttons and the user changes to 4-button layout, **When** viewing the board, **Then** only the first 4 buttons are visible (others preserved but hidden)

---

### User Story 6 - Set Edit Mode PIN (Priority: P2)

A caregiver sets a PIN code to protect edit mode from accidental changes by children. On first use, they are prompted to create a PIN. They can change it later from settings.

**Why this priority**: Essential for child safety - without PIN protection, children could accidentally delete or modify their communication buttons.

**Independent Test**: Can be tested by setting a PIN, exiting edit mode, and verifying PIN is required to re-enter.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** the caregiver taps to enter edit mode, **Then** they are prompted to create a 4-digit PIN
2. **Given** a PIN has been set, **When** the caregiver taps to enter edit mode, **Then** they must enter the correct PIN to proceed
3. **Given** an incorrect PIN is entered, **When** the caregiver submits it, **Then** an error is shown and they can retry
4. **Given** the caregiver is in edit mode, **When** they access settings, **Then** they can change their PIN

---

### Edge Cases

- What happens when the device has no microphone? The record audio option is disabled with a clear message.
- What happens when storage is full? User receives a warning before the operation fails, with guidance to free space.
- What happens when an imported image is corrupted? The system shows a user-friendly error and does not add the image.
- What happens when the user exits during recording? The partial recording is discarded and no audio is saved.
- What happens on very slow devices? The UI remains responsive; audio loading shows a brief indicator if needed.
- What happens when the caregiver forgets their PIN? A reset option is available (clears PIN, not board data).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a grid of communication buttons on the main screen
- **FR-002**: System MUST play associated audio when a button is tapped
- **FR-003**: System MUST support grid layouts of 1, 2, 4, 9, and 16 buttons
- **FR-004**: System MUST allow users to import images from the device photo library
- **FR-005**: System MUST allow users to record audio using the device microphone
- **FR-006**: System MUST persist all board data (images, audio, layout) locally on the device
- **FR-007**: System MUST work completely offline after initial load
- **FR-008**: System MUST provide visual feedback when a button is tapped (e.g., highlight)
- **FR-009**: System MUST maintain minimum touch target size of 44x44 pixels for all buttons
- **FR-010**: System MUST stop any currently playing audio when a new button is tapped
- **FR-011**: System MUST preserve button content when grid layout is changed (hidden buttons retain their data)
- **FR-012**: System MUST support both portrait and landscape orientations
- **FR-013**: System MUST require a PIN/passcode to enter edit mode (protects against accidental child modifications)
- **FR-014**: System MUST allow caregivers to set and change their edit mode PIN
- **FR-015**: System MUST limit audio recordings to a maximum of 30 seconds
- **FR-016**: System MUST show a visual indicator of remaining recording time during audio capture

### Key Entities

- **Board**: A collection of buttons arranged in a grid. Has a layout configuration (number of buttons) and contains multiple Button entities.
- **Button**: A single communication option. Contains an optional image, optional audio recording, and position in the grid.
- **Audio Recording**: A sound file associated with a button. Has duration and can be played back.
- **Image**: A visual representation on a button. Stored locally, automatically resized for display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can tap a button and hear audio play within 300ms (perceived as instant)
- **SC-002**: A caregiver can add an image and record audio for a button in under 60 seconds
- **SC-003**: The app loads and displays the board in under 2 seconds on a typical device
- **SC-004**: The app functions fully offline after first load (no network dependency for core features)
- **SC-005**: 90% of first-time users can successfully tap a button to play audio without instruction
- **SC-006**: Board data persists across app restarts with 100% reliability
- **SC-007**: Touch targets meet accessibility standards (minimum 44x44 pixels) on all supported screen sizes

## Clarifications

### Session 2025-12-01

- Q: How do caregivers access edit mode, and is it protected from children? → A: PIN/passcode protection required to enter edit mode
- Q: What is the maximum audio recording duration? → A: 30 seconds (standard for AAC apps)

## Assumptions

- Users have a device with a microphone for recording audio
- Users have photos on their device or can take photos to import
- A single board with one layout is sufficient for MVP (multiple boards deferred)
- Text labels on buttons are not required for MVP (image + audio is sufficient)
- No user accounts or authentication required (per constitution)
- Web Speech API fallback for TTS is out of scope for this MVP (recording only)
