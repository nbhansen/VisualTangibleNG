/**
 * Audio Recording Service
 *
 * Audio capture using MediaRecorder API.
 */

import type {
  IAudioRecordingService,
  RecordingOptions,
  RecordingSession,
  RecordingResult,
} from '../../types/audio';
import { AudioError } from '../../types/audio';
import { MAX_AUDIO_DURATION_SECONDS } from '../../types';

class AudioRecordingService implements IAudioRecordingService {
  private currentSession: ActiveRecordingSession | null = null;

  isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && navigator.mediaDevices !== undefined;
  }

  async hasMicrophone(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === 'audioinput');
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately - we just needed to check permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  async startRecording(options?: RecordingOptions): Promise<RecordingSession> {
    if (!this.isSupported()) {
      throw new AudioError('Recording not supported in this browser', 'NOT_SUPPORTED');
    }

    if (this.currentSession) {
      throw new AudioError('Already recording', 'ALREADY_RECORDING');
    }

    const hasMic = await this.hasMicrophone();
    if (!hasMic) {
      throw new AudioError('No microphone detected', 'NO_MICROPHONE');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const session = new ActiveRecordingSession(stream, options);
      this.currentSession = session;

      // Clear reference when session ends
      session.onComplete = () => {
        this.currentSession = null;
      };

      return session;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new AudioError('Microphone permission denied', 'PERMISSION_DENIED');
      }
      throw new AudioError(
        `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NOT_SUPPORTED'
      );
    }
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }
}

class ActiveRecordingSession implements RecordingSession {
  state: 'recording' | 'stopped' = 'recording';
  elapsedTime = 0;

  private mediaRecorder: MediaRecorder;
  private chunks: Blob[] = [];
  private startTime: number;
  private maxDuration: number;
  private timeUpdateInterval: number | null = null;
  private stream: MediaStream;
  private resolveStop: ((result: RecordingResult) => void) | null = null;
  private rejectStop: ((error: Error) => void) | null = null;

  onComplete: (() => void) | null = null;

  constructor(stream: MediaStream, options?: RecordingOptions) {
    this.stream = stream;
    this.maxDuration = options?.maxDurationSeconds ?? MAX_AUDIO_DURATION_SECONDS;
    this.startTime = Date.now();

    // Determine supported MIME type
    const mimeType = this.getSupportedMimeType();

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 64000, // Lower bitrate for smaller files
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.finalize();
    };

    this.mediaRecorder.onerror = () => {
      if (this.rejectStop) {
        this.rejectStop(new AudioError('Recording failed', 'NOT_SUPPORTED'));
      }
      this.cleanup();
    };

    // Start recording
    this.mediaRecorder.start(1000); // Collect data every second

    // Time update callback
    if (options?.onTimeUpdate) {
      this.timeUpdateInterval = window.setInterval(() => {
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        options.onTimeUpdate?.(this.elapsedTime);

        // Auto-stop at max duration
        if (this.elapsedTime >= this.maxDuration) {
          options.onMaxDurationReached?.();
          this.stop();
        }
      }, 100);
    } else {
      // Still need to track time for auto-stop
      this.timeUpdateInterval = window.setInterval(() => {
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        if (this.elapsedTime >= this.maxDuration) {
          this.stop();
        }
      }, 100);
    }
  }

  private getSupportedMimeType(): string {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  async stop(): Promise<RecordingResult> {
    if (this.state === 'stopped') {
      throw new AudioError('Not recording', 'NOT_RECORDING');
    }

    return new Promise((resolve, reject) => {
      this.resolveStop = resolve;
      this.rejectStop = reject;
      this.state = 'stopped';
      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    this.cleanup();
  }

  private finalize(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    const duration = (Date.now() - this.startTime) / 1000;
    const mimeType = this.mediaRecorder.mimeType;
    const blob = new Blob(this.chunks, { type: mimeType });

    // Determine output MIME type
    let outputMimeType: RecordingResult['mimeType'] = 'audio/webm';
    if (mimeType.includes('mp4')) {
      outputMimeType = 'audio/mp4';
    } else if (mimeType.includes('ogg')) {
      outputMimeType = 'audio/ogg';
    }

    this.cleanup();

    if (this.resolveStop) {
      this.resolveStop({
        blob,
        mimeType: outputMimeType,
        duration: Math.min(duration, this.maxDuration),
      });
    }

    this.onComplete?.();
  }

  private cleanup(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }

    this.stream.getTracks().forEach((track) => track.stop());
    this.chunks = [];
    this.state = 'stopped';
    this.onComplete?.();
  }
}

// Singleton instance
let audioRecordingService: AudioRecordingService | null = null;

export function getAudioRecordingService(): AudioRecordingService {
  if (!audioRecordingService) {
    audioRecordingService = new AudioRecordingService();
  }
  return audioRecordingService;
}

export { AudioRecordingService };
