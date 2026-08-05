/* eslint-disable @typescript-eslint/no-explicit-any */
export type TranscriptResult = {
  transcript: string;
  method: 'groq' | 'browser';
  success: boolean;
  error?: string;
};

export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptResult> {

  console.log('[Transcribe] Blob size:', audioBlob.size, 'bytes');

  // CRITICAL: Reject silence before sending to Groq
  // Blob under 3000 bytes = silence = do not send
  if (audioBlob.size < 3000) {
    console.warn(
      '[Transcribe] Audio blob too small:', 
      audioBlob.size, 
      'bytes — likely silence'
    );
    return {
      transcript: '',
      method: 'groq',
      success: false,
      error: 'NO_AUDIO_DETECTED',
    };
  }

  console.log('[Transcribe] Sending to Groq:', audioBlob.size, 'bytes');

  try {
    const formData = new FormData();
    formData.append(
      'audio', 
      audioBlob, 
      'recording.webm'
    );

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();
    console.log('[Transcribe] Groq response:', data);

    if (response.ok && data.transcript) {
      // CRITICAL: Validate transcript is real Arabic
      // Groq hallucinates when audio is silent
      // Real speech will have Arabic characters
      const hasArabic = /[\u0600-\u06FF]/.test(
        data.transcript
      );
      
      console.log('[Transcribe] Has Arabic:', hasArabic);

      if (!hasArabic) {
        console.warn(
          '[Transcribe] Groq returned non-Arabic text:', 
          data.transcript,
          '— likely hallucination from silence'
        );
        return {
          transcript: '',
          method: 'groq',
          success: false,
          error: 'HALLUCINATION_DETECTED',
        };
      }

      console.log('[Transcribe] Final transcript:', data.transcript);

      return {
        transcript: data.transcript,
        method: 'groq',
        success: true,
      };
    }
  } catch (err) {
    console.warn('[Transcribe] Groq failed:', err);
  }

  // Fallback to browser ASR
  try {
    const transcript = await browserSpeechRecognition();
    if (transcript) {
      console.log('[Transcribe] Browser ASR transcript:', transcript);
      return {
        transcript,
        method: 'browser',
        success: true,
      };
    }
  } catch (err) {
    console.warn('[Transcribe] Browser ASR failed:', err);
  }

  return {
    transcript: '',
    method: 'browser',
    success: false,
    error: 'BOTH_METHODS_FAILED',
  };
}

function browserSpeechRecognition(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      reject(new Error('Not supported'));
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    let resolved = false;

    recognition.onresult = (event: any) => {
      if (resolved) return;
      resolved = true;

      const results: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(
          event.results[0][i].transcript.trim()
        );
      }
      
      console.log('[Transcribe] Browser ASR alternatives:', results);
      resolve(results[0]);
    };

    recognition.onerror = (e: any) => {
      if (resolved) return;
      resolved = true;
      reject(new Error(e.error));
    };

    recognition.onend = () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('No speech detected'));
      }
    };

    recognition.start();
  });
}
