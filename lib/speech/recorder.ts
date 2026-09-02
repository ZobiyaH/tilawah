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
    console.log('[Recorder] Starting mic...');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('[Recorder] AudioContext state:', this.audioContext.state);

      if (this.audioContext.state !== 'running') {
        throw new Error(
          'AudioContext could not start. ' +
          'Please tap the mic button to begin.'
        );
      }

      const tracks = this.stream.getAudioTracks();
      if (tracks.length === 0) {
        throw new Error('No audio track found');
      }

      const track = tracks[0];
      if (track.readyState !== 'live') {
        throw new Error('Mic track is not live');
      }

      // Pre-create and keep persistent analyser node connected for fast continuous RMS VAD
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(analyser);
      this.analyserNode = analyser;
      this.dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Setup MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }

      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(
        this.stream,
        options
      );

      this.audioChunks = [];
      this.hasAudio = false;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.hasAudio = true;
        }
      };

      // Collect data every 100ms
      this.mediaRecorder.start(100);
      console.log('[Recorder] Recording started. MimeType:', mimeType);

    } catch (err: any) {
      console.error('[Recorder] Mic start error:', err);
      
      if (err.name === 'NotAllowedError') {
        throw new Error(
          'Microphone permission denied. ' +
          'Click the lock icon in your browser ' +
          'address bar and allow microphone access.'
        );
      }
      if (err.name === 'NotFoundError') {
        throw new Error(
          'No microphone found. ' +
          'Please connect a microphone and try again.'
        );
      }
      if (err.name === 'NotReadableError') {
        throw new Error(
          'Microphone is being used by another app. ' +
          'Close other apps and try again.'
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

        console.log('[Recorder] Final continuous blob:', blob.size, 'bytes');

        if (blob.size < 1000) {
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Measure real-time volume RMS using Web Audio API
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
