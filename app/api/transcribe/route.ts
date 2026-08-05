/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq, { toFile } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  console.log('[API] Transcribe GET healthcheck. Key configured:', !!key, key ? `(Starts with: ${key.substring(0, 8)})` : '');
  if (!key) {
    return NextResponse.json(
      { status: 'offline', fallback: true, error: 'API not configured' },
      { status: 503 }
    );
  }
  return NextResponse.json({ status: 'online' });
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'Groq not configured', fallback: true },
        { status: 503 }
      );
    }

    const groq = new Groq({
      apiKey: key,
    });

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file', fallback: true },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('[API] Received audio:', {
      size: audioFile.size,
      type: audioFile.type,
      name: audioFile.name,
    });

    // Reject if too small — definitely silence
    if (audioFile.size < 3000) {
      console.warn('[API] Audio too short — size:', audioFile.size);
      return NextResponse.json(
        { 
          error: 'Audio too short — no speech detected',
          fallback: true,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const fileToUpload = await toFile(buffer, 'recording.webm', { type: 'audio/webm' });

    console.log('[API] Sending to Groq...');
    const transcription = await groq.audio.transcriptions.create({
      file: fileToUpload,
      model: 'whisper-large-v3',
      language: 'ar',
      prompt: 'بسم الله الرحمن الرحيم الحمد لله',
      response_format: 'json',
      temperature: 0.0,
    });

    const transcript = transcription.text.trim();
    console.log('[API] Groq returned:', transcript);

    // Check if transcript has Arabic
    const hasArabic = /[\u0600-\u06FF]/.test(transcript);
    if (!hasArabic || transcript.length < 2) {
      console.warn('[API] Non-Arabic or empty transcript returned:', transcript);
      return NextResponse.json(
        { 
          error: 'No Arabic speech detected',
          transcript: '',
          success: false,
        }
      );
    }

    return NextResponse.json({
      transcript,
      success: true,
    });

  } catch (error: any) {
    console.error('[API] Transcription error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
