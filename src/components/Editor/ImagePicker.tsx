/**
 * ImagePicker Component
 *
 * File input for selecting images from device.
 */

import { useCallback, useRef } from 'react';
import { SUPPORTED_IMAGE_TYPES } from '../../types/image';
import './Editor.css';

interface ImagePickerProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImagePicker({ onImageSelected, disabled = false }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelected(file);
        // Reset input so same file can be selected again
        e.target.value = '';
      }
    },
    [onImageSelected]
  );

  return (
    <div className="image-picker">
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_IMAGE_TYPES.join(',')}
        onChange={handleChange}
        className="image-picker__input"
        disabled={disabled}
        aria-label="Select image"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="image-picker__button"
      >
        Choose Image
      </button>
    </div>
  );
}
