/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq, { toFile } from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  console.log("Transcribe GET healthcheck. Key configured:", !!key, key ? `(Starts with: ${key.substring(0, 8)})` : "");
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
    console.log("Transcribe POST request received. Key configured:", !!key);
    if (!key) {
      return NextResponse.json(
        { error: 'API not configured', fallback: true },
        { status: 503 }
      );
    }

    const groq = new Groq({
      apiKey: key,
    });

    // Get audio from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size (Groq limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max 25MB.' },
        { status: 400 }
      );
    }

    const prompt = (formData.get('prompt') as string) || 'بسم الله الرحمن الرحيم';

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const fileToUpload = await toFile(buffer, 'audio.webm', { type: 'audio/webm' });

    // Send to Groq Whisper large-v3-turbo
    const transcription = await groq.audio.transcriptions.create({
      file: fileToUpload,
      model: 'whisper-large-v3-turbo',
      language: 'ar',
      prompt: prompt,
      response_format: 'json',
      temperature: 0.0,
    });

    console.log("Groq transcription successful. Text:", transcription.text);

    return NextResponse.json({
      transcript: transcription.text.trim(),
      success: true,
    });

  } catch (error: any) {
    console.error('Groq transcription error:', error);
    
    // If Groq fails, tell client to use browser ASR
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        fallback: true,
        message: error.message,
      },
      { status: 500 }
    );
  }
}


