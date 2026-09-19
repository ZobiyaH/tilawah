/* eslint-disable @typescript-eslint/no-explicit-any */

export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];

  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('[AudioRecorder] Using supported mimeType:', type);
      return type;
    }
  }

  console.warn('[AudioRecorder] No preferred mimeType supported, using browser default');
  return '';
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private hasAudio: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private activeMimeType: string = '';

  async start(): Promise<void> {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    console.log('[AudioRecorder] Starting mic on:', isMobile ? 'Mobile' : 'Desktop');

    try {
      // Mobile-friendly constraints without strict sampleRate
      const audioConstraints: MediaTrackConstraints = isMobile
        ? {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
          }
        : {
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: true,
            channelCount: 1,
          };

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createMediaStreamSource(this.stream);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(isMobile ? 3.0 : 1.5, this.audioContext.currentTime);

        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(gainNode);
        gainNode.connect(analyser);
        this.analyserNode = analyser;
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
      }

      const tracks = this.stream.getAudioTracks();
      if (tracks.length === 0) {
        throw new Error('No audio track found');
      }

      const track = tracks[0];
      if (track.readyState !== 'live') {
        throw new Error('Mic track is not live');
      }

      this.activeMimeType = getSupportedMimeType();
      const options = this.activeMimeType ? { mimeType: this.activeMimeType } : {};

      // Record directly from genuine hardware MediaStream for valid EBML / MP4 containers
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      console.log('[AudioRecorder] MediaRecorder initialized with mimeType:', this.mediaRecorder.mimeType);

      this.audioChunks = [];
      this.hasAudio = false;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.hasAudio = true;
        }
      };

      // Do not use timeslice intervals on mobile to ensure single contiguous header and container
      this.mediaRecorder.start();

    } catch (err: any) {
      console.error('[AudioRecorder] Mic start error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error(
          'Microphone permission denied. ' +
          'Please allow microphone access in your browser or phone settings.'
        );
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error(
          'No microphone found. ' +
          'Please connect or enable a microphone and try again.'
        );
      }
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error(
          'Microphone is being used by another app. ' +
          'Close other apps using audio and try again.'
        );
      }
      throw new Error(err.message || 'Could not access microphone');
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const MIN_BLOB_SIZE = 2000;

      if (!this.mediaRecorder) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.stream?.getTracks().forEach(t => t.stop());
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {});
        }
        this.audioContext = null;
        this.analyserNode = null;
        this.dataArray = null;

        if (!this.hasAudio || this.audioChunks.length === 0) {
          console.warn('[AudioRecorder] Stop finished with 0 chunks/no audio');
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || this.activeMimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, {
          type: mimeType
        });

        const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        console.log('[AudioRecorder] Final blob details:', {
          size: blob.size,
          type: blob.type,
          platform: isMobile ? 'mobile' : 'desktop',
          chunksCount: this.audioChunks.length
        });

        if (blob.size < MIN_BLOB_SIZE) {
          console.warn('[AudioRecorder] Blob too small:', blob.size, 'bytes (min:', MIN_BLOB_SIZE, ')');
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        resolve(blob);
      };

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        } else {
          resolve(new Blob(this.audioChunks));
        }
      } catch {
        resolve(new Blob(this.audioChunks));
      }
    });
  }

  async getRMSLevel(): Promise<number> {
    if (!this.analyserNode || !this.dataArray) return 0;
    
    this.analyserNode.getByteTimeDomainData(this.dataArray as unknown as Uint8Array<ArrayBuffer>);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = (this.dataArray[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / this.dataArray.length);
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

/**
 * UserAudioVault: Stores and plays back the user's own recorded voice
 * for letters, words, phrases, and verse recitations.
 */
export interface AudioRecordEntry {
  id: string;
  blob: Blob;
  url: string;
  transcript?: string;
  timestamp: number;
}

class UserAudioVaultManager {
  private static instance: UserAudioVaultManager;
  private cache: Map<string, AudioRecordEntry> = new Map();
  private latestGlobalEntry: AudioRecordEntry | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private listeners: Set<() => void> = new Set();

  public static getInstance(): UserAudioVaultManager {
    if (!UserAudioVaultManager.instance) {
      UserAudioVaultManager.instance = new UserAudioVaultManager();
    }
    return UserAudioVaultManager.instance;
  }

  /**
   * Save a user voice recording
   */
  public saveRecording(id: string, blob: Blob, transcript?: string): string {
    const existing = this.cache.get(id);
    if (existing && existing.url) {
      try { URL.revokeObjectURL(existing.url); } catch {}
    }

    const objectUrl = URL.createObjectURL(blob);
    const entry: AudioRecordEntry = {
      id,
      blob,
      url: objectUrl,
      transcript,
      timestamp: Date.now(),
    };

    this.cache.set(id, entry);
    this.latestGlobalEntry = entry;
    this.notify();
    return objectUrl;
  }

  /**
   * Get recording for a specific item (e.g. 'letter_ba', 'ayah_1_2', 'word_3', or 'last_user_voice')
   */
  public getRecording(id: string): AudioRecordEntry | undefined {
    return this.cache.get(id);
  }

  /**
   * Get the most recently recorded user audio
   */
  public getLatestRecording(): AudioRecordEntry | null {
    return this.latestGlobalEntry;
  }

  /**
   * Play back the user's recorded audio
   */
  public async playRecording(idOrEntry?: string | AudioRecordEntry): Promise<void> {
    let entry: AudioRecordEntry | undefined | null = null;

    if (!idOrEntry) {
      entry = this.latestGlobalEntry;
    } else if (typeof idOrEntry === "string") {
      entry = this.cache.get(idOrEntry) || this.latestGlobalEntry;
    } else {
      entry = idOrEntry;
    }

    if (!entry || !entry.url) {
      console.warn("[UserAudioVault] No user recording found to play.");
      return;
    }

    this.stop();

    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(entry.url);
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.currentAudioElement = null;
          this.notify();
          resolve();
        };

        audio.onerror = (e) => {
          this.currentAudioElement = null;
          this.notify();
          reject(e);
        };

        this.notify();
        audio.play().catch((err) => {
          this.currentAudioElement = null;
          this.notify();
          reject(err);
        });
      } catch (err) {
        this.currentAudioElement = null;
        this.notify();
        reject(err);
      }
    });
  }

  public isPlaying(): boolean {
    return !!(this.currentAudioElement && !this.currentAudioElement.paused);
  }

  public stop(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
      this.notify();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }
}

export const userAudioVault = UserAudioVaultManager.getInstance();
