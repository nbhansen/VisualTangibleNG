/**
 * Image Service Implementation
 *
 * Handles image import, resize, and format conversion using Canvas API.
 */

import type { IImageService, ProcessedImage, ImageProcessingOptions } from '../../types/image';
import { ImageError, SUPPORTED_IMAGE_TYPES, type SupportedImageType } from '../../types/image';
import { MAX_IMAGE_DIMENSION_PX } from '../../types';

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxDimension: MAX_IMAGE_DIMENSION_PX,
  preferredFormat: 'webp',
  quality: 0.8,
};

export class ImageService implements IImageService {
  private options: Required<ImageProcessingOptions>;

  constructor(options?: ImageProcessingOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async importImage(file: File): Promise<ProcessedImage> {
    if (!this.isSupported(file)) {
      throw new ImageError(
        `Unsupported image format: ${file.type}`,
        'UNSUPPORTED_FORMAT'
      );
    }

    return this.processImage(file);
  }

  async importFromBlob(blob: Blob): Promise<ProcessedImage> {
    if (!SUPPORTED_IMAGE_TYPES.includes(blob.type as SupportedImageType)) {
      throw new ImageError(
        `Unsupported image format: ${blob.type}`,
        'UNSUPPORTED_FORMAT'
      );
    }

    return this.processImage(blob);
  }

  createObjectUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeObjectUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  isSupported(file: File): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType);
  }

  private async processImage(source: Blob): Promise<ProcessedImage> {
    // Load image
    const img = await this.loadImage(source);

    // Calculate new dimensions
    const { width, height } = this.calculateDimensions(img.width, img.height);

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ImageError('Failed to create canvas context', 'PROCESS_FAILED');
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const { blob, mimeType } = await this.canvasToBlob(canvas);

    return {
      blob,
      mimeType,
      width,
      height,
    };
  }

  private loadImage(source: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(source);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new ImageError('Failed to load image', 'LOAD_FAILED'));
      };

      img.src = url;
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number
  ): { width: number; height: number } {
    const maxDim = this.options.maxDimension;

    if (originalWidth <= maxDim && originalHeight <= maxDim) {
      return { width: originalWidth, height: originalHeight };
    }

    const ratio = Math.min(maxDim / originalWidth, maxDim / originalHeight);

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement
  ): Promise<{ blob: Blob; mimeType: ProcessedImage['mimeType'] }> {
    // Try preferred format first
    const formats: Array<{ type: string; mimeType: ProcessedImage['mimeType'] }> = [
      { type: 'image/webp', mimeType: 'image/webp' },
      { type: 'image/jpeg', mimeType: 'image/jpeg' },
      { type: 'image/png', mimeType: 'image/png' },
    ];

    // Reorder based on preference
    if (this.options.preferredFormat === 'jpeg') {
      formats.unshift(formats.splice(1, 1)[0]);
    } else if (this.options.preferredFormat === 'png') {
      formats.unshift(formats.splice(2, 1)[0]);
    }

    for (const format of formats) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, format.type, this.options.quality);
        });

        if (blob && blob.size > 0) {
          return { blob, mimeType: format.mimeType };
        }
      } catch {
        // Try next format
      }
    }

    throw new ImageError('Failed to convert image to blob', 'PROCESS_FAILED');
  }
}

// Singleton instance
let imageServiceInstance: ImageService | null = null;

export function getImageService(): ImageService {
  if (!imageServiceInstance) {
    imageServiceInstance = new ImageService();
  }
  return imageServiceInstance;
}
