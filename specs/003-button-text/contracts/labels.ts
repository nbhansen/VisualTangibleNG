/**
 * Button Text Labels Contracts
 *
 * Extends the core types to support text labels on buttons.
 */

/**
 * Position for text labels relative to button image.
 */
export type LabelPosition = 'above' | 'below' | 'hidden';

/**
 * Maximum length for button labels.
 */
export const MAX_LABEL_LENGTH = 50;

/**
 * Validates a label string.
 * @param label The label to validate
 * @returns true if valid (null, or string 1-50 chars after trim)
 */
export function isValidLabel(label: string | null): boolean {
  if (label === null) return true;
  const trimmed = label.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_LABEL_LENGTH;
}

/**
 * Normalizes a label for storage (trims whitespace).
 * @param label The label to normalize
 * @returns Trimmed label, or null if empty/whitespace-only
 */
export function normalizeLabel(label: string | null | undefined): string | null {
  if (label === null || label === undefined) return null;
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extended Button interface with label support.
 */
export interface ButtonWithLabel {
  id: string;
  boardId: string;
  position: number;
  imageId: string | null;
  audioId: string | null;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended Board interface with label position.
 */
export interface BoardWithLabelPosition {
  id: string;
  layout: 1 | 2 | 4 | 9 | 16;
  labelPosition: LabelPosition;
  createdAt: string;
  updatedAt: string;
}

/**
 * Props for label display in BoardButton component.
 */
export interface ButtonLabelProps {
  /** The label text to display, or null for no label */
  label: string | null;

  /** Position of the label relative to image */
  position: LabelPosition;
}

/**
 * Props for label input in ButtonEditor component.
 */
export interface LabelInputProps {
  /** Current label value */
  value: string;

  /** Callback when label changes */
  onChange: (value: string) => void;

  /** Maximum length (default: 50) */
  maxLength?: number;

  /** Placeholder text */
  placeholder?: string;
}

/**
 * Props for label position selector.
 */
export interface LabelPositionSelectorProps {
  /** Current position */
  value: LabelPosition;

  /** Callback when position changes */
  onChange: (position: LabelPosition) => void;
}

/**
 * Extended storage service interface for label operations.
 */
export interface IStorageServiceWithLabels {
  /**
   * Update a button's label.
   * @param buttonId The button ID
   * @param label The new label (null to remove)
   */
  updateButtonLabel(buttonId: string, label: string | null): Promise<void>;

  /**
   * Update the board's label position setting.
   * @param boardId The board ID
   * @param position The new label position
   */
  updateBoardLabelPosition(boardId: string, position: LabelPosition): Promise<void>;
}
