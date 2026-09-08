/* eslint-disable @typescript-eslint/no-explicit-any */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private hasAudio: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  async start(): Promise<void> {
    try {
      // Mobile-friendly constraints: avoid rigid sampleRate: 16000 which throws OverconstrainedError on iOS/Android
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
        }
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(analyser);
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

      // Setup MediaRecorder with cross-platform mobile fallback (WebM -> MP4 -> AAC -> default)
      let mimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg'
      ];

      for (const type of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.hasAudio = false;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.hasAudio = true;
        }
      };

      this.mediaRecorder.start(100);

    } catch (err: any) {
      console.error('Mic start error:', err);
      
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
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, {
          type: mimeType
        });

        if (blob.size < 500) {
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        resolve(blob);
      };

      try {
        this.mediaRecorder.stop();
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
