# VoiceTicket

Convert audio feedback and meeting recordings into structured Jira tickets using Whisper speech-to-text and Claude AI.

## Architecture

| Service | Stack | Port |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS | 3000 |
| Backend | FastAPI + OpenAI Whisper | 8000 |

The frontend proxies `/api/*` requests to the backend, so no CORS configuration is needed in production.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An [OpenRouter](https://openrouter.ai) API key

## Running with Docker

```bash
# 1. Clone the repo
git clone https://github.com/mactuc/voiceticket.git
cd voiceticket

# 2. Create your .env file
echo "OPENROUTER_API_KEY=your_key_here" > .env

# 3. Build and start both services
docker compose up --build
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

**Frontend**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | API key from openrouter.ai |
| `BACKEND_URL` | No | Backend base URL (default: `http://127.0.0.1:8000`) |

## How it works

1. Record or upload audio on the Capture screen
2. Audio is sent to the backend and transcribed by Whisper
3. The transcription is passed to Claude (via OpenRouter) which extracts structured Jira tickets
4. Review and edit tickets in the Blueprint view before syncing to Jira
