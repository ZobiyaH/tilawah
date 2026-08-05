/* eslint-disable @typescript-eslint/no-explicit-any */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private hasAudio: boolean = false;
  private audioContext: AudioContext | null = null;

  async start(): Promise<void> {
    console.log('[Recorder] Starting mic...');
    try {
      // CRITICAL: Request mic with exact constraints
      // noiseSuppression: false because it kills quiet Arabic
      // autoGainControl: true to boost quiet voices
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        }
      });

      // CRITICAL: Create and immediately resume AudioContext
      // Chrome suspends AudioContext by default
      // Must resume it on user gesture (button tap)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('[Recorder] AudioContext state:', this.audioContext.state);

      // Check AudioContext is actually running
      if (this.audioContext.state !== 'running') {
        throw new Error(
          'AudioContext could not start. ' +
          'Please tap the mic button to begin.'
        );
      }

      // Verify we are actually getting audio signal by checking stream tracks
      const tracks = this.stream.getAudioTracks();
      console.log('[Recorder] Stream tracks:', tracks.length);
      if (tracks.length === 0) {
        throw new Error('No audio track found');
      }

      const track = tracks[0];
      console.log('[Recorder] Mic track settings:', track.getSettings());
      console.log('[Recorder] Mic track state:', track.readyState);

      if (track.readyState !== 'live') {
        throw new Error('Mic track is not live');
      }

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
          console.log(
            '[Recorder] Chunk received:', 
            event.data.size, 'bytes'
          );
        }
      };

      // Collect data every 100ms for better detection
      this.mediaRecorder.start(100);
      console.log('[Recorder] Recording started. MimeType:', mimeType);

    } catch (err: any) {
      console.error('[Recorder] Mic start error:', err);
      
      // Give user friendly error messages
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
        // Stop all tracks to release microphone
        this.stream?.getTracks().forEach(t => t.stop());
        
        // Close AudioContext
        this.audioContext?.close();
        this.audioContext = null;

        if (!this.hasAudio || this.audioChunks.length === 0) {
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        const mimeType = 
          this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { 
          type: mimeType 
        });

        console.log(
          '[Recorder] Final blob:', 
          blob.size, 'bytes'
        );

        // CRITICAL: Check blob is not too small
        // Less than 1000 bytes = silence = reject it
        if (blob.size < 1000) {
          reject(new Error('NO_AUDIO_DETECTED'));
          return;
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Check if recording contains actual voice
  // Uses Web Audio API to measure volume
  async getRMSLevel(): Promise<number> {
    if (!this.audioContext || !this.stream) return 0;
    
    const analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(
      this.stream
    );
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(
      analyser.frequencyBinCount
    );
    analyser.getByteTimeDomainData(dataArray);
    
    // Calculate RMS (volume level)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    source.disconnect();
    return rms;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
