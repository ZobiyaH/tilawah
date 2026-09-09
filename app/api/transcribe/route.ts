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

    if (audioFile.size < 1200) {
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
    const rawType = (audioFile.type || '').toLowerCase();
    let fileName = 'recording.webm';
    let mimeType = 'audio/webm';
    if (rawType.includes('mp4') || (audioFile.name && audioFile.name.endsWith('.mp4'))) {
      fileName = 'recording.mp4';
      mimeType = 'audio/mp4';
    } else if (rawType.includes('aac') || rawType.includes('m4a')) {
      fileName = 'recording.m4a';
      mimeType = 'audio/m4a';
    } else if (rawType.includes('ogg')) {
      fileName = 'recording.ogg';
      mimeType = 'audio/ogg';
    } else if (rawType.includes('wav')) {
      fileName = 'recording.wav';
      mimeType = 'audio/wav';
    } else {
      fileName = 'recording.webm';
      mimeType = 'audio/webm';
    }

    const fileToUpload = await toFile(buffer, fileName, { type: mimeType });

    // Lightning fast Groq Whisper call with json format
    const transcription: any = await groq.audio.transcriptions.create({
      file: fileToUpload,
      model: 'whisper-large-v3',
      language: 'ar',
      prompt: genericArabicPrompt,
      response_format: 'json',
      temperature: 0.0,
    });

    const transcript = (transcription.text || '').trim();
    console.log('[API] Groq rapid transcript:', transcript);

    const hasArabic = /[\u0600-\u06FF]/.test(transcript);
    if (!transcript || transcript.length < 1 || !hasArabic) {
      return NextResponse.json({
        decision: 'no_speech',
        transcript: '',
        message: 'No Arabic speech detected',
        success: false,
      });
    }

    return NextResponse.json({
      transcript,
      success: true,
      decision: 'speech_detected',
    });

  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn('[API] Transcribe error:', errorMsg);
    return NextResponse.json(
      {
        error: errorMsg,
        fallback: true,
        decision: 'no_speech',
        success: false,
        transcript: '',
      },
      { status: 200 }
    );
  }
}
