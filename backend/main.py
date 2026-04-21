from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import whisper
import os
import db
import auth
import uuid
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional

class SessionCreate(BaseModel):
    id: str
    title: str
    timestamp: str
    durationMs: int
    ticketCount: int
    tickets: List[Dict[str, Any]]
    transcription: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginToken(BaseModel):
    credential: str

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
    # Save temporary audio file safely using a UUID
    safe_filename = "".join(c for c in (file.filename or "audio.wav") if c.isalnum() or c in "._-")
    temp_filename = f"temp_{uuid.uuid4().hex}_{safe_filename}"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())
    
    # Transcribe using Whisper
    result = model.transcribe(temp_filename, fp16=False)
    
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

@app.post("/auth/register")
async def register(user: UserRegister):
    existing = db.get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = auth.get_password_hash(user.password)
    db.create_user({
        "id": user_id,
        "email": user.email,
        "password_hash": hashed_password,
        "auth_provider": "local",
        "name": user.name,
        "picture": None
    })
    
    token = auth.create_access_token(data={"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user_id, "email": user.email, "name": user.name}}

@app.post("/auth/login")
async def login(user: UserLogin):
    db_user = db.get_user_by_email(user.email)
    if not db_user or db_user.get("auth_provider") != "local":
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not auth.verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    token = auth.create_access_token(data={"sub": db_user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": {"id": db_user["id"], "email": db_user["email"], "name": db_user.get("name")}}

@app.post("/auth/google")
async def google_login(token_data: GoogleLoginToken):
    # Verify Google token
    idinfo = auth.verify_google_token(token_data.credential)
    email = idinfo["email"]
    name = idinfo.get("name")
    picture = idinfo.get("picture")
    
    db_user = db.get_user_by_email(email)
    if not db_user:
        # Create new user
        user_id = str(uuid.uuid4())
        db_user = db.create_user({
            "id": user_id,
            "email": email,
            "password_hash": None,
            "auth_provider": "google",
            "name": name,
            "picture": picture
        })
    else:
        user_id = db_user["id"]
        
    token = auth.create_access_token(data={"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user_id, "email": email, "name": name, "picture": picture}}

@app.get("/users/me")
async def get_current_user_profile(user_id: str = Depends(auth.get_current_user)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "picture": user.get("picture")}

@app.get("/sessions")
async def get_all_sessions(user_id: str = Depends(auth.get_current_user)):
    return {"sessions": db.get_sessions(user_id=user_id)}

@app.post("/sessions")
async def create_session(session: SessionCreate, user_id: str = Depends(auth.get_current_user)):
    db.add_session(session.model_dump() if hasattr(session, 'model_dump') else session.dict(), user_id=user_id)
    return {"status": "success"}

@app.delete("/sessions")
async def clear_all_sessions(user_id: str = Depends(auth.get_current_user)):
    db.clear_sessions(user_id=user_id)
    return {"status": "success"}
