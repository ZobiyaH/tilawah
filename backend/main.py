import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import uvicorn

app = FastAPI(title="Whisper Transcription Server")

# Allow CORS so Next.js frontend can communicate directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model on startup. Allows switching model sizing (large-v3, medium, base) via env var
model_name = os.getenv("WHISPER_MODEL", "large-v3")
print(f"Loading Whisper model '{model_name}' (this may take a few moments)...")
model = whisper.load_model(model_name)
print("Whisper model loaded successfully!")

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    prompt: str = Form(None)
):
    # Save the uploaded file to a temporary file path
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Run Whisper inference. Specify language='ar' for Arabic.
        # initial_prompt is highly powerful here to guide Uthmani diacritics/spelling.
        result = model.transcribe(
            tmp_path,
            language="ar",
            initial_prompt=prompt
        )
        transcript = result.get("text", "").strip()
        print(f"Transcribed Text: {transcript}")
        return {"transcript": transcript}
    except Exception as e:
        print(f"Transcription error: {e}")
        return {"error": str(e)}, 500
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
