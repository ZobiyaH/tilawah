export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      // Use webm format — supported everywhere
      const mimeType = MediaRecorder.isTypeSupported(
        'audio/webm;codecs=opus'
      )
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(
        this.stream, 
        { mimeType }
      );
      
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Collect data every 250ms
      this.mediaRecorder.start(250);

    } catch {
      throw new Error(
        'Microphone access denied. ' +
        'Please allow microphone permission.'
      );
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = 
          this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(
          this.audioChunks, 
          { type: mimeType }
        );
        
        // Stop all tracks to release mic
        this.stream?.getTracks().forEach(t => t.stop());
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
