/* eslint-disable @typescript-eslint/no-explicit-any */
export type TranscriptResult = {
  transcript: string;
  method: 'groq' | 'browser';
  success: boolean;
  error?: string;
};

export async function transcribeAudio(
  audioBlob: Blob,
  lessonType: 'letter' | 'word' | 'phrase' | 'ayah' = 'word',
  prompt: string = ''
): Promise<TranscriptResult> {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const MIN_BLOB_SIZE = 2000;

  console.log('[Transcribe] Audio blob details:', {
    size: audioBlob.size,
    type: audioBlob.type,
    platform: isMobile ? 'mobile' : 'desktop',
    lessonType,
  });

  if (audioBlob.size < MIN_BLOB_SIZE) {
    console.warn('[Transcribe] Blob too small:', audioBlob.size, 'bytes');
    return {
      transcript: '',
      method: 'groq',
      success: false,
      error: 'NO_AUDIO_DETECTED',
    };
  }

  try {
    const formData = new FormData();
    const ext = audioBlob.type && audioBlob.type.includes('mp4') ? 'recording.mp4' : 'recording.webm';
    formData.append('audio', audioBlob, ext);
    if (prompt) {
      formData.append('prompt', prompt);
    }

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();
    console.log('[Transcribe] Groq response:', data);

    if (response.ok && data.transcript) {
      const hasArabic = /[\u0600-\u06FF]/.test(data.transcript);
      if (!hasArabic) {
        return { transcript: '', method: 'groq', success: false, error: 'HALLUCINATION_DETECTED' };
      }
      return { transcript: data.transcript, method: 'groq', success: true };
    }
  } catch (err) {
    console.warn('[Transcribe] Groq failed:', err);
  }

  return { transcript: '', method: 'browser', success: false, error: 'BOTH_METHODS_FAILED' };
}
