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
import httpx

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

class JiraCallback(BaseModel):
    code: str
    redirectUri: str

class JiraSyncRequest(BaseModel):
    tickets: List[Dict[str, Any]]
    projectKey: str = "VT"

import os
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path)
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
    
    try:
        client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        
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

@app.get("/jira/auth-url")
async def get_jira_auth_url(redirect_uri: str = "http://localhost:3000/settings"):
    client_id = os.getenv("JIRA_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="JIRA_CLIENT_ID not configured")
    
    # scope string needs offline_access for refresh tokens
    scopes = "read:jira-work write:jira-work read:jira-user offline_access"
    import urllib.parse
    encoded_redirect = urllib.parse.quote(redirect_uri, safe='')
    url = f"https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id={client_id}&scope={scopes}&redirect_uri={encoded_redirect}&state=jira&response_type=code&prompt=consent"
    return {"url": url}

@app.post("/jira/callback")
async def jira_callback(data: JiraCallback, user_id: str = Depends(auth.get_current_user)):
    client_id = os.getenv("JIRA_CLIENT_ID")
    client_secret = os.getenv("JIRA_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Jira credentials not configured")

    async with httpx.AsyncClient() as client:
        # 1. Exchange code for token
        token_res = await client.post("https://auth.atlassian.com/oauth/token", json={
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": data.code,
            "redirect_uri": data.redirectUri
        })
        
        if token_res.status_code != 200:
            print("Token error:", token_res.text)
            raise HTTPException(status_code=400, detail="Failed to exchange token")
            
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        # 2. Get Cloud ID
        resources_res = await client.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        )
        
        if resources_res.status_code != 200 or not resources_res.json():
            print("Resources error:", resources_res.text)
            raise HTTPException(status_code=400, detail="Failed to get accessible resources")
            
        resources = resources_res.json()
        cloud_id = resources[0]["id"]
        
        # 3. Get Account ID for Personal Data Reporting
        me_res = await client.get(
            "https://api.atlassian.com/me",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        )
        
        account_id = None
        if me_res.status_code == 200:
            me_data = me_res.json()
            account_id = me_data.get("account_id")
        else:
            print("Warning: Failed to fetch account_id for personal data reporting", me_res.text)
        
        # 4. Save to DB
        db.update_user_jira_tokens(user_id, access_token, refresh_token, cloud_id, account_id)
        
        return {"status": "success", "cloud_id": cloud_id}

@app.get("/jira/status")
async def get_jira_status(user_id: str = Depends(auth.get_current_user)):
    user = db.get_user_by_id(user_id)
    is_connected = bool(user and user.get("jira_access_token"))
    return {"is_connected": is_connected}

@app.delete("/jira/connection")
async def disconnect_jira(user_id: str = Depends(auth.get_current_user)):
    db.clear_user_jira_tokens(user_id)
    return {"status": "success"}

async def refresh_jira_token(user_id: str, refresh_token: str):
    client_id = os.getenv("JIRA_CLIENT_ID")
    client_secret = os.getenv("JIRA_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        return None
        
    async with httpx.AsyncClient() as client:
        res = await client.post("https://auth.atlassian.com/oauth/token", json={
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token
        })
        
        if res.status_code == 200:
            data = res.json()
            new_access = data.get("access_token")
            new_refresh = data.get("refresh_token")
            
            # Update DB with new tokens (keep existing cloud_id and account_id)
            user = db.get_user_by_id(user_id)
            db.update_user_jira_tokens(user_id, new_access, new_refresh, user.get("jira_cloud_id"), user.get("jira_account_id"))
            return new_access
    return None

@app.post("/jira/sync")
async def sync_jira_tickets(req: JiraSyncRequest, user_id: str = Depends(auth.get_current_user)):
    user = db.get_user_by_id(user_id)
    if not user or not user.get("jira_access_token") or not user.get("jira_cloud_id"):
        raise HTTPException(status_code=400, detail="Jira not connected")
        
    access_token = user["jira_access_token"]
    cloud_id = user["jira_cloud_id"]
    
    api_base = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Pre-flight check to test if token is expired
        test_res = await client.get(f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself", headers=headers)
        if test_res.status_code == 401 and user.get("jira_refresh_token"):
            new_access = await refresh_jira_token(user_id, user["jira_refresh_token"])
            if new_access:
                headers["Authorization"] = f"Bearer {new_access}"
            else:
                raise HTTPException(status_code=401, detail="Jira session expired. Please reconnect.")
                
    synced_count = 0
    
    def create_adf_description(text):
        if not text:
            return {
                "type": "doc",
                "version": 1,
                "content": []
            }
        return {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": text
                        }
                    ]
                }
            ]
        }
    
    async with httpx.AsyncClient() as client:
        for epic in req.tickets:
            # Create Epic
            epic_payload = {
                "fields": {
                    "project": {"key": req.projectKey},
                    "summary": epic.get("summary", "Untitled Epic"),
                    "description": create_adf_description(epic.get("description", "")),
                    "issuetype": {"name": "Epic"}
                }
            }
            # Need to set Epic Name field for Epics (customfield_10011 usually, but varies. Let's just create as Story if Epic fails or omit Epic Name if optional. In next-gen projects, Epic Name is not required. If it fails, fallback to Story)
            epic_res = await client.post(api_base, headers=headers, json=epic_payload)
            epic_key = None
            if epic_res.status_code == 201:
                epic_key = epic_res.json().get("key")
                synced_count += 1
            else:
                # Fallback to Task if Epic requires custom fields we don't know
                epic_payload["fields"]["issuetype"] = {"name": "Task"}
                epic_res = await client.post(api_base, headers=headers, json=epic_payload)
                if epic_res.status_code == 201:
                    epic_key = epic_res.json().get("key")
                    synced_count += 1
                else:
                    print("Failed to create parent item:", epic_res.text)
                    continue
            
            # Create subtasks or linked stories
            for sub in epic.get("subtasks", []):
                sub_payload = {
                    "fields": {
                        "project": {"key": req.projectKey},
                        "summary": sub.get("summary", "Untitled Subtask"),
                        "description": create_adf_description(sub.get("description", "")),
                        "issuetype": {"name": "Sub-task"},
                        "parent": {"key": epic_key}
                    }
                }
                sub_res = await client.post(api_base, headers=headers, json=sub_payload)
                if sub_res.status_code == 201:
                    synced_count += 1
                else:
                    # Fallback to Task
                    sub_payload["fields"]["issuetype"] = {"name": "Task"}
                    del sub_payload["fields"]["parent"]
                    sub_res2 = await client.post(api_base, headers=headers, json=sub_payload)
                    if sub_res2.status_code == 201:
                        synced_count += 1
                        
    return {"status": "success", "synced_count": synced_count}

@app.post("/admin/jira/report-privacy")
async def report_jira_privacy(user_id: str = Depends(auth.get_current_user)):
    user = db.get_user_by_id(user_id)
    if not user or not user.get("jira_access_token"):
        raise HTTPException(status_code=400, detail="Jira not connected. Admin token required.")
        
    access_token = user["jira_access_token"]
    account_ids = db.get_all_jira_account_ids()
    
    if not account_ids:
        return {"status": "success", "message": "No Atlassian accounts to report."}
        
    # Formatting for Atlassian API
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    
    accounts_payload = []
    for aid in account_ids:
        accounts_payload.append({
            "accountId": aid,
            "updatedAt": now
        })
        
    # Atlassian allows up to 90 accounts per request. 
    # For a real app with many users, we'd need to batch this.
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Test token validity
        test_res = await client.get("https://api.atlassian.com/me", headers={"Authorization": f"Bearer {access_token}"})
        if test_res.status_code == 401 and user.get("jira_refresh_token"):
            new_access = await refresh_jira_token(user_id, user["jira_refresh_token"])
            if new_access:
                headers["Authorization"] = f"Bearer {new_access}"
            else:
                raise HTTPException(status_code=401, detail="Jira session expired. Please reconnect.")

        # We only send the first 90 for this prototype
        batch = accounts_payload[:90]
        res = await client.post(
            "https://api.atlassian.com/app/report-accounts/",
            headers=headers,
            json={"accounts": batch}
        )
        
        if res.status_code != 200:
            print("Privacy reporting failed:", res.status_code, res.text)
            raise HTTPException(status_code=res.status_code, detail="Failed to report to Atlassian")
            
        return {"status": "success", "message": f"Reported {len(batch)} accounts."}
