/**
 * Image Service Interface
 *
 * Defines the contract for image import and processing.
 * Handles resizing and format conversion client-side.
 */

// =============================================================================
// Image Service Interface
// =============================================================================

export interface IImageService {
  /**
   * Import an image from a File (from file input or drag-drop).
   * Automatically resizes to max dimensions and converts format.
   */
  importImage(file: File): Promise<ProcessedImage>;

  /**
   * Import an image from a Blob (e.g., from clipboard).
   */
  importFromBlob(blob: Blob): Promise<ProcessedImage>;

  /**
   * Create an object URL for displaying an image blob.
   * Caller is responsible for revoking when done.
   */
  createObjectUrl(blob: Blob): string;

  /**
   * Revoke an object URL to free memory.
   */
  revokeObjectUrl(url: string): void;

  /**
   * Check if a file is a supported image type.
   */
  isSupported(file: File): boolean;
}

export interface ProcessedImage {
  /** The processed image as a Blob */
  blob: Blob;
  /** MIME type of the output */
  mimeType: 'image/webp' | 'image/jpeg' | 'image/png';
  /** Final width in pixels */
  width: number;
  /** Final height in pixels */
  height: number;
}

// =============================================================================
// Image Processing Options
// =============================================================================

export interface ImageProcessingOptions {
  /** Maximum width or height in pixels (default: 512) */
  maxDimension?: number;
  /** Output format preference (default: 'webp', falls back to 'jpeg') */
  preferredFormat?: 'webp' | 'jpeg' | 'png';
  /** JPEG/WebP quality 0-1 (default: 0.8) */
  quality?: number;
}

// =============================================================================
// Supported Formats
// =============================================================================

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

// =============================================================================
// Image Errors
// =============================================================================

export class ImageError extends Error {
  readonly code: ImageErrorCode;

  constructor(message: string, code: ImageErrorCode) {
    super(message);
    this.name = 'ImageError';
    this.code = code;
  }
}

export type ImageErrorCode =
  | 'UNSUPPORTED_FORMAT' // File type not supported
  | 'LOAD_FAILED' // Failed to load image
  | 'PROCESS_FAILED' // Failed to resize/convert
  | 'TOO_LARGE' // File size exceeds limit
  | 'CORRUPTED'; // Image data is corrupted
