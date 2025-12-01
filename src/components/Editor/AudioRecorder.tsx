/**
 * AudioRecorder Component
 *
 * Record audio with timer and preview.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getAudioRecordingService } from '../../services/audio';
import { getAudioPlaybackService } from '../../services/audio';
import type { RecordingResult, RecordingSession } from '../../types/audio';
import { MAX_AUDIO_DURATION_SECONDS } from '../../types';
import { formatDuration, formatRemainingTime } from '../../utils/time';
import './Editor.css';

interface AudioRecorderProps {
  onSave: (result: RecordingResult) => void;
  disabled?: boolean;
}

type RecorderState = 'idle' | 'recording' | 'previewing';

export function AudioRecorder({ onSave, disabled = false }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);

  const sessionRef = useRef<RecordingSession | null>(null);
  const previewBufferRef = useRef<AudioBuffer | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current?.state === 'recording') {
        sessionRef.current.cancel();
      }
    };
  }, []);

  const handleStartRecording = useCallback(async () => {
    setError(null);

    try {
      const service = getAudioRecordingService();

      // Check support
      if (!service.isSupported()) {
        setError('Recording not supported in this browser');
        return;
      }

      // Start recording
      const session = await service.startRecording({
        maxDurationSeconds: MAX_AUDIO_DURATION_SECONDS,
        onTimeUpdate: (time) => {
          setElapsedTime(time);
        },
        onMaxDurationReached: () => {
          // Auto-stop handled by session
        },
      });

      sessionRef.current = session;
      setState('recording');
      setElapsedTime(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      const result = await sessionRef.current.stop();
      sessionRef.current = null;

      setRecordingResult(result);
      setState('previewing');

      // Pre-decode for preview
      try {
        const playbackService = getAudioPlaybackService();
        await playbackService.initialize();
        const buffer = await playbackService.decodeAudio(result.blob);
        previewBufferRef.current = buffer;
      } catch {
        // Preview decode failed, but we can still save
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setState('idle');
    }
  }, []);

  const handleCancelRecording = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.cancel();
      sessionRef.current = null;
    }
    setState('idle');
    setElapsedTime(0);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!recordingResult) return;

    try {
      const playbackService = getAudioPlaybackService();
      await playbackService.initialize();

      if (previewBufferRef.current) {
        playbackService.play(previewBufferRef.current);
      } else {
        const buffer = await playbackService.decodeAudio(recordingResult.blob);
        previewBufferRef.current = buffer;
        playbackService.play(buffer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play preview');
    }
  }, [recordingResult]);

  const handleSave = useCallback(() => {
    if (recordingResult) {
      onSave(recordingResult);
      setRecordingResult(null);
      previewBufferRef.current = null;
      setState('idle');
      setElapsedTime(0);
    }
  }, [recordingResult, onSave]);

  const handleDiscard = useCallback(() => {
    setRecordingResult(null);
    previewBufferRef.current = null;
    setState('idle');
    setElapsedTime(0);
  }, []);

  // Idle state - show record button
  if (state === 'idle') {
    return (
      <div className="audio-recorder">
        {error && (
          <p className="audio-recorder__error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleStartRecording}
          disabled={disabled}
          className="audio-recorder__button audio-recorder__button--record"
        >
          Record Audio
        </button>
      </div>
    );
  }

  // Recording state
  if (state === 'recording') {
    return (
      <div className="audio-recorder audio-recorder--recording">
        <div className="audio-recorder__timer">
          <span className="audio-recorder__elapsed">{formatDuration(elapsedTime)}</span>
          <span className="audio-recorder__separator">/</span>
          <span className="audio-recorder__remaining">
            {formatRemainingTime(elapsedTime, MAX_AUDIO_DURATION_SECONDS)}
          </span>
        </div>

        <div className="audio-recorder__indicator" aria-label="Recording in progress">
          <span className="audio-recorder__dot"></span>
          Recording...
        </div>

        <div className="audio-recorder__actions">
          <button
            type="button"
            onClick={handleCancelRecording}
            className="audio-recorder__button audio-recorder__button--cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStopRecording}
            className="audio-recorder__button audio-recorder__button--stop"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Previewing state
  return (
    <div className="audio-recorder audio-recorder--previewing">
      <p className="audio-recorder__info">
        Recorded {formatDuration(recordingResult?.duration ?? 0)}
      </p>

      <div className="audio-recorder__actions">
        <button
          type="button"
          onClick={handleDiscard}
          className="audio-recorder__button audio-recorder__button--discard"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="audio-recorder__button audio-recorder__button--preview"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="audio-recorder__button audio-recorder__button--save"
        >
          Save
        </button>
      </div>
    </div>
  );
}
