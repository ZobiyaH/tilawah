/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:8000/", { signal: AbortSignal.timeout(500) }).catch(() => null);
    if (response) {
      return NextResponse.json({ status: "online" });
    }
    return NextResponse.json({ status: "offline", fallback: true }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "offline", fallback: true }, { status: 200 });
  }
}

/**
 * POST endpoint for /api/transcribe
 * Receives an audio blob (typically audio/webm or audio/wav) representing recitation.
 * 
 * Whisper Integration Blueprint:
 * 1. Read request form data: `const formData = await request.formData();`
 * 2. Retrieve audio payload: `const audioBlob = formData.get("audio") as Blob;`
 * 3. Convert blob to file/buffer: `const buffer = Buffer.from(await audioBlob.arrayBuffer());`
 * 4. Instantiate OpenAI SDK or local model loader.
 * 5. Send to OpenAI Whisper Audio Transcriptions API:
 *    ```
 *    const transcription = await openai.audio.transcriptions.create({
 *      file: fs.createReadStream(tempAudioFilePath),
 *      model: "whisper-1",
 *      language: "ar", // Force Arabic for Quranic transcription
 *      prompt: "تلاوة القرآن الكريم بالتجويد", // prompt helps guide Whisper
 *    });
 *    ```
 * 6. Return response: `return NextResponse.json({ transcript: transcription.text, confidence: 0.99 });`
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    const prompt = (formData.get("prompt") as string) || "";

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Build the request body for the FastAPI server
    const backendFormData = new FormData();
    backendFormData.append("audio", audioBlob, "audio.wav");
    if (prompt) {
      backendFormData.append("prompt", prompt);
    }

    console.log(`Forwarding audio chunk to FastAPI backend (Prompt length: ${prompt.length})`);
    
    // Call the self-hosted Whisper FastAPI server
    const response = await fetch("http://127.0.0.1:8000/transcribe", {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("FastAPI Whisper server error:", errText);
      return NextResponse.json({ error: "Whisper backend error" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      transcript: data.transcript || "",
      confidence: 0.99
    });
  } catch (e: any) {
    if (e.code === "ECONNREFUSED" || (e.cause && e.cause.code === "ECONNREFUSED")) {
      console.warn("FastAPI Whisper server is offline (ECONNREFUSED). Clients will default to browser Web Speech API.");
      return NextResponse.json({ error: "Whisper server offline", fallback: true, transcript: "" }, { status: 200 });
    }
    console.error("API Error in /api/transcribe proxy router:", e);
    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 }
    );
  }
}
