/**
 * ButtonEditor Component
 *
 * Edit panel for selected button - image and audio management.
 */

import { useState, useCallback } from 'react';
import type { ButtonWithMedia } from '../../types';
import type { RecordingResult } from '../../types/audio';
import { ImagePicker } from './ImagePicker';
import { AudioRecorder } from './AudioRecorder';
import { getImageService } from '../../services/image';
import { useStorage } from '../../hooks/useStorage';
import './Editor.css';

interface ButtonEditorProps {
  button: ButtonWithMedia;
  onUpdate: (button: ButtonWithMedia) => void;
}

export function ButtonEditor({ button, onUpdate }: ButtonEditorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveImage, deleteImage, saveAudio, deleteAudio } = useStorage();

  const handleImageSelected = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);

      try {
        const imageService = getImageService();
        const processed = await imageService.importImage(file);

        // Save to storage
        const savedImage = await saveImage(
          button.id,
          processed.blob,
          processed.mimeType,
          processed.width,
          processed.height
        );

        // Update button with new image
        const imageUrl = URL.createObjectURL(processed.blob);
        onUpdate({
          ...button,
          imageId: savedImage.id,
          image: savedImage,
          imageUrl,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import image');
      } finally {
        setIsProcessing(false);
      }
    },
    [button, saveImage, onUpdate]
  );

  const handleRemoveImage = useCallback(async () => {
    if (!button.imageId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Revoke object URL
      if (button.imageUrl) {
        URL.revokeObjectURL(button.imageUrl);
      }

      await deleteImage(button.imageId);

      onUpdate({
        ...button,
        imageId: null,
        image: null,
        imageUrl: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setIsProcessing(false);
    }
  }, [button, deleteImage, onUpdate]);

  const handleAudioSave = useCallback(
    async (result: RecordingResult) => {
      setIsProcessing(true);
      setError(null);

      try {
        const savedAudio = await saveAudio(
          button.id,
          result.blob,
          result.mimeType,
          result.duration
        );

        onUpdate({
          ...button,
          audioId: savedAudio.id,
          audio: savedAudio,
          audioBuffer: null, // Will be decoded on playback
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save audio');
      } finally {
        setIsProcessing(false);
      }
    },
    [button, saveAudio, onUpdate]
  );

  const handleRemoveAudio = useCallback(async () => {
    if (!button.audioId) return;

    setIsProcessing(true);
    setError(null);

    try {
      await deleteAudio(button.audioId);

      onUpdate({
        ...button,
        audioId: null,
        audio: null,
        audioBuffer: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove audio');
    } finally {
      setIsProcessing(false);
    }
  }, [button, deleteAudio, onUpdate]);

  return (
    <div className="button-editor">
      <h2 className="button-editor__title">Button {button.position + 1}</h2>

      {error && (
        <p className="button-editor__error" role="alert">
          {error}
        </p>
      )}

      {/* Image Section */}
      <section className="button-editor__section">
        <h3>Image</h3>

        {button.imageUrl ? (
          <div className="button-editor__preview">
            <img
              src={button.imageUrl}
              alt="Button preview"
              className="button-editor__image"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isProcessing}
              className="button-editor__remove"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <ImagePicker onImageSelected={handleImageSelected} disabled={isProcessing} />
        )}

        {isProcessing && <p className="button-editor__loading">Processing...</p>}
      </section>

      {/* Audio Section */}
      <section className="button-editor__section">
        <h3>Audio</h3>

        {button.audio ? (
          <div className="button-editor__audio">
            <p>Audio recorded ({Math.round(button.audio.duration)}s)</p>
            <button
              type="button"
              onClick={handleRemoveAudio}
              disabled={isProcessing}
              className="button-editor__remove"
            >
              Remove Audio
            </button>
          </div>
        ) : (
          <AudioRecorder onSave={handleAudioSave} disabled={isProcessing} />
        )}
      </section>
    </div>
  );
}
