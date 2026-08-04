/* eslint-disable @typescript-eslint/no-explicit-any */
type TranscriptResult = {
  transcript: string;
  method: 'groq' | 'browser';
  success: boolean;
};

export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptResult> {
  
  // METHOD 1: Try Groq first (best accuracy)
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

    if (response.ok && data.transcript) {
      console.log('✅ Groq transcript:', data.transcript);
      return {
        transcript: data.transcript,
        method: 'groq',
        success: true,
      };
    }
  } catch (err) {
    console.warn('Groq failed, trying browser ASR:', err);
  }

  // METHOD 2: Browser Speech API fallback
  try {
    const transcript = await browserSpeechRecognition();
    console.log('✅ Browser ASR transcript:', transcript);
    return {
      transcript,
      method: 'browser',
      success: true,
    };
  } catch (err) {
    console.error('Both methods failed:', err);
    return {
      transcript: '',
      method: 'browser',
      success: false,
    };
  }
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

      // Check all alternatives
      // Pick the one most similar to any Arabic
      const results: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(
          event.results[0][i].transcript.trim()
        );
      }
      
      console.log('Browser ASR alternatives:', results);
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
