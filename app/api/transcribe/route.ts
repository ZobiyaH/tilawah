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
        { error: 'Groq not configured', fallback: true, decision: 'no_speech' },
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
        { error: 'No audio file', fallback: true, decision: 'no_speech' },
        { status: 400 }
      );
    }

    // Reject if too small — definitely silence/noise
    if (audioFile.size < 800) {
      console.warn('[API] Audio too short / silent — size:', audioFile.size);
      return NextResponse.json(
        { 
          error: 'Audio too short — no speech detected',
          decision: 'no_speech',
          transcript: '',
          success: false,
        },
        { status: 200 }
      );
    }

    const prompt = (formData.get('prompt') as string) || 'بسم الله الرحمن الرحيم الحمد لله رب العالمين';

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const fileToUpload = await toFile(buffer, 'recording.webm', { type: 'audio/webm' });

    console.log('[API] Sending continuous audio to Groq with prompt:', prompt);
    const transcription: any = await groq.audio.transcriptions.create({
      file: fileToUpload,
      model: 'whisper-large-v3',
      language: 'ar',
      prompt: prompt,
      response_format: 'verbose_json',
      temperature: 0.0,
    });

    const transcript = (transcription.text || '').trim();
    const avgLogprob = typeof transcription.avg_logprob === 'number' ? transcription.avg_logprob : 0;
    console.log('[API] Groq verbose returned:', { transcript, avgLogprob });

    // FIX 3: Background noise / low confidence / non-Arabic speech detection
    const hasArabic = /[\u0600-\u06FF]/.test(transcript);
    if (!transcript || transcript.length < 1 || !hasArabic || (avgLogprob !== 0 && avgLogprob < -1.8)) {
      console.warn('[API] Unclear or noisy audio detected:', { transcript, avgLogprob });
      return NextResponse.json({
        decision: 'no_speech',
        transcript: '',
        message: "We couldn't hear you clearly. Check your microphone and try again.",
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
    console.error('[API] Transcription error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        fallback: true,
        decision: 'no_speech',
      },
      { status: 500 }
    );
  }
}
