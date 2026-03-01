from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model (using "base" for speed vs accuracy balance)
model = whisper.load_model("base")

@app.get("/")
async def root():
    return {"message": "VoiceTicket Backend is Running"}

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save temporary audio file
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())
    
    # Transcribe using Whisper
    result = model.transcribe(temp_filename)
    
    # Cleanup
    os.remove(temp_filename)
    
    return {"text": result["text"]}

@app.post("/extract-jira/")
async def extract_jira_tickets(transcription: str):
    """
    Uses the internal system model to extract structured Jira tickets from transcription.
    """
    prompt_path = "01-Projects/voiceticket/backend/prompts/jira_extraction.txt"
    with open(prompt_path, "r") as f:
        template = f.read()
    
    full_prompt = template.replace("{{transcription}}", transcription)
    
    # Simulate internal calling logic (this would normally be an API call)
    # For the MVP, we will save the prompt for execution or use an agent run
    return {"status": "ready_for_extraction", "prompt": full_prompt}
