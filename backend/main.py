import os
import re
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

app = FastAPI(title="Tilawah API - Groq Powered")

# Allow CORS so Next.js frontend can communicate directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


@app.get("/health")
def health():
    return {"status": "ok", "provider": "Groq Whisper Cloud API"}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    prompt: str = Form("بسم الله الرحمن الرحيم")
):
    """
    Transcribe audio using Groq's whisper-large-v3-turbo model.
    Accepts optional prompt form parameter for guiding diacritics/spelling.
    """
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="GROQ_API_KEY environment variable is missing."
        )

    # Determine file extension
    suffix = ".wav"
    if audio.content_type:
        if "webm" in audio.content_type:
            suffix = ".webm"
        elif "mp4" in audio.content_type:
            suffix = ".mp4"

    # Save incoming audio stream to temporary file
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as file_obj:
            # Call Groq's Hosted Whisper
            transcription = client.audio.transcriptions.create(
                file=(audio.filename or f"audio{suffix}", file_obj),
                model="whisper-large-v3-turbo",
                language="ar",
                prompt=prompt,
                response_format="verbose_json",
            )

        transcript = transcription.text.strip()
        print(f"Transcribed Text: {transcript}")

        # Extract word timestamps if present
        words = []
        if hasattr(transcription, "words") and transcription.words:
            for w in transcription.words:
                words.append({
                    "word": w.get("word", "").strip(),
                    "start": w.get("start"),
                    "end": w.get("end"),
                })

        return {
            "transcript": transcript,
            "words": words,
            "language": "ar"
        }

    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/compare")
async def compare(data: dict):
    """
    Compare spoken Quranic text against expected verse/word.
    """
    spoken = data.get("spoken", "")
    expected = data.get("expected", "")
    lesson_type = data.get("lessonType", "word")

    if not spoken or not expected:
        raise HTTPException(status_code=400, detail="spoken and expected text are required")

    normalized_spoken = normalize_arabic(spoken)
    normalized_expected = normalize_arabic(expected)

    similarity = arabic_similarity(normalized_spoken, normalized_expected)

    thresholds = {
        "letter": {"correct": 0.50, "close": 0.30},
        "word":   {"correct": 0.60, "close": 0.40},
        "phrase": {"correct": 0.62, "close": 0.42},
        "ayah":   {"correct": 0.62, "close": 0.42},
    }
    t = thresholds.get(lesson_type, thresholds["word"])

    if similarity >= t["correct"]:
        decision = "correct"
    elif similarity >= t["close"]:
        decision = "close"
    else:
        decision = "wrong"

    return {
        "decision": decision,
        "similarity": round(similarity, 3),
        "normalizedSpoken": normalized_spoken,
        "normalizedExpected": normalized_expected
    }


def normalize_arabic(text: str) -> str:
    if not text:
        return ""
    # Strip diacritics, tatweel, and normalize alef/ta marbuta
    text = re.sub(r'[\u064B-\u065F\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06ED]', '', text)
    text = re.sub(r'\u0640', '', text)
    text = re.sub(r'[أإآٱ]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'[ؤئ]', '', text)
    text = re.sub(r'ء', '', text)
    return text.strip()


def arabic_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0

    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])

    max_len = max(m, n)
    return 1 - (dp[m][n] / max_len)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)