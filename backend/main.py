from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import whisper
import os

load_dotenv()

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins (including ngrok tunnels)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Whisper model (using "base" for speed vs accuracy balance)
model = whisper.load_model("base")

@app.get("/")
async def root():
    return {"message": "VoiceTicket Backend is Running"}

@app.post("/transcribe")
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

@app.post("/extract-jira")
async def extract_jira_tickets(transcription: str):
    """
    Uses the internal system model to extract structured Jira tickets from transcription.
    """
    # Use absolute path or path relative to the backend directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(base_dir, "prompts", "jira_extraction.txt")
    with open(prompt_path, "r") as f:
        template = f.read()
    
    full_prompt = template.replace("{{transcription}}", transcription)
    
    # Call OpenRouter via OpenAI client
    from openai import AsyncOpenAI
    import json
    
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
    
    try:
        response = await client.chat.completions.create(
            model="anthropic/claude-3-haiku", # A fast model suitable for prompt parsing
            messages=[
                {"role": "user", "content": full_prompt}
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000", # Required for OpenRouter
                "X-Title": "VoiceTicket Local Dev", # Required for OpenRouter
            }
        )
        
        content = response.choices[0].message.content
        
        # In case the model responds with a markdown code block, clean it up
        content = content.strip()
        if content.startswith("```json"):
            content = content[len("```json"):].strip()
        if content.startswith("```"):
            content = content[3:].strip()
        if content.endswith("```"):
            content = content[:-3].strip()
            
        tickets = json.loads(content)
        return {"status": "success", "tickets": tickets}
        
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        return {"status": "error", "message": str(e)}
