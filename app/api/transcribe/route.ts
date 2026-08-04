/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function GET() {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { status: 'offline', fallback: true, error: 'API not configured' },
      { status: 503 }
    );
  }
  return NextResponse.json({ status: 'online' });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'API not configured', fallback: true },
        { status: 503 }
      );
    }

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

    // Send to Groq Whisper large-v3
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'ar',
      prompt: 'بسم الله الرحمن الرحيم',
      response_format: 'json',
      temperature: 0.0,
    });

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


