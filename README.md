# VoiceTicket

Convert audio feedback and meeting recordings into structured Jira tickets using Whisper speech-to-text and Claude AI.

## Architecture

| Service | Stack | Port |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS | 3000 |
| Backend | FastAPI + OpenAI Whisper + SQLite | 8000 |

The frontend proxies `/api/*` requests to the backend, so no CORS configuration is needed in production local docker setups. 

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An [OpenRouter](https://openrouter.ai) API key
- Google Cloud OAuth Web Client ID (for Google SSO)

## Running with Docker

```bash
# 1. Clone the repo
git clone https://github.com/mactuc/voiceticket.git
cd voiceticket

# 2. Create your .env file
echo "OPENROUTER_API_KEY=your_key_here" > .env
echo "JWT_SECRET=super_secret_dev_key" >> .env
echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com" >> .env

# 3. Build and start both services
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

> **First build is slow** — the backend image downloads the Whisper `base` model (~150 MB) and CPU-only PyTorch during `docker build`. Subsequent starts are instant.

## Running locally (dev)

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
> Note: The SQLite database (`sessions.db`) will auto-generate upon first script execution.

**Frontend**
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description | Location |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | API key from openrouter.ai | Backend |
| `JWT_SECRET` | Yes | Secret string array strictly used to cryptographically sign sessions | Backend |
| `GOOGLE_CLIENT_ID` | Yes | Matching string mapping to identical NEXT_PUBLIC format | Backend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Public Web OAuth configuration identity target array | Frontend |
| `BACKEND_URL` | No | Backend base URL (default: `http://127.0.0.1:8000`) | Frontend |

## How it works

1. Users create local persistence or login securely through Google SSO
2. Record or upload audio within their localized private workspace segment
3. Audio is sent to the backend and transcribed securely by localized Whisper execution
4. The transcription is passed to Claude (via OpenRouter) which extracts structured Jira tickets
5. Review and edit tickets securely before syncing cleanly to your ecosystem
