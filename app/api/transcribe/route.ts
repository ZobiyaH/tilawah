/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq, { toFile } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  console.log('[API] Transcribe GET healthcheck. Key configured:', Boolean(key));
  if (!key) {
    return NextResponse.json(
      { status: 'offline', fallback: true, error: 'GROQ_API_KEY environment variable is not configured in Vercel/Production' },
      { status: 503 }
    );
  }
  return NextResponse.json({ status: 'online', keyConfigured: true });
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      console.error('[API] Transcription failed: GROQ_API_KEY is missing from process.env');
      return NextResponse.json(
        { error: 'Groq API key not configured on server', fallback: true, decision: 'no_speech' },
        { status: 200 }
      );
    }

    const groq = new Groq({ apiKey: key });

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e: any) {
      console.error('[API] Failed to parse formData:', e);
      return NextResponse.json({ error: 'Invalid form data', decision: 'no_speech' }, { status: 200 });
    }

    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file uploaded', decision: 'no_speech' }, { status: 200 });
    }

    console.log('[API] Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    if (audioFile.size < 300) {
      return NextResponse.json({
        error: 'Audio too short',
        decision: 'no_speech',
        transcript: '',
        success: false,
      }, { status: 200 });
    }

    const clientPrompt = (formData.get('prompt') as string) || '';
    const genericArabicPrompt = clientPrompt || 'القرآن الكريم تلاوة عربية فصيحة واضحة';

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Safe file name and MIME determination for Groq Whisper
    let fileName = audioFile.name || 'recording.webm';
    let mimeType = audioFile.type || 'audio/webm';
    if (mimeType.includes('mp4') || fileName.endsWith('.mp4')) {
      fileName = 'recording.mp4';
      mimeType = 'audio/mp4';
    } else if (mimeType.includes('aac') || fileName.endsWith('.aac')) {
      fileName = 'recording.m4a';
      mimeType = 'audio/m4a';
    } else {
      fileName = 'recording.webm';
      mimeType = 'audio/webm';
    }

    const fileToUpload = await toFile(buffer, fileName, { type: mimeType });

    console.log('[API] Sending to Groq Whisper:', { fileName, mimeType, size: buffer.length });
    const transcription: any = await groq.audio.transcriptions.create({
      file: fileToUpload,
      model: 'whisper-large-v3',
      language: 'ar',
      prompt: genericArabicPrompt,
      response_format: 'verbose_json',
      temperature: 0.0,
    });

    const transcript = (transcription.text || '').trim();
    const avgLogprob = typeof transcription.avg_logprob === 'number' ? transcription.avg_logprob : 0;
    console.log('[API] Groq response transcript:', transcript, 'avgLogprob:', avgLogprob);

    const hasArabic = /[\u0600-\u06FF]/.test(transcript);
    if (!transcript || transcript.length < 1 || !hasArabic || (avgLogprob !== 0 && avgLogprob < -2.8)) {
      return NextResponse.json({
        decision: 'no_speech',
        transcript: '',
        message: 'Unclear voice signal',
        success: false,
      });
    }

    return NextResponse.json({
      transcript,
      avgLogprob,
      success: true,
      decision: 'speech_detected',
    });

  } catch (error: any) {
    console.error('[API] Transcribe uncaught handler error:', error?.message || error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal transcription error',
        fallback: true,
        decision: 'no_speech',
      },
      { status: 200 }
    );
  }
}
