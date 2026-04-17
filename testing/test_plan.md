# VoiceTicket Test Plan

## 1. Project Overview
VoiceTicket is an application designed to convert audio recordings into structured Jira tickets using Whisper transcription and LLM-based extraction.

- **Frontend:** Next.js (App Router)
- **Backend:** FastAPI
- **Core Services:** OpenAI Whisper (Local), LLM Extraction.

## 2. Testing Objectives
- Verify backend API stability and performance.
- Validate the audio-to-transcription pipeline.
- Verify structured Jira ticket extraction logic.
- Ensure the frontend handles recording and state management correctly.

## 3. Scope of Testing

### 3.1 Backend Testing (FastAPI)
| Test Case | Description | Method |
|-----------|-------------|--------|
| Root Endpoint | Verify `GET /` returns 200 OK. | `curl` |
| Transcription | Upload a `.wav` file and verify text response. | `curl` |
| Extraction Prompt | Submit text and verify returned prompt template. | `curl` |

### 3.2 Frontend Testing (Next.js)
| Test Case | Description | Method |
|-----------|-------------|--------|
| UI Rendering | Ensure buttons and layout load correctly. | Browser Snapshot |
| State Capture | Verify recording triggers state change (Mic -> Stop). | Browser Act |
| API Integration | Verify frontend calls `/transcribe` on stop. | Browser Console / Network |

### 3.3 Integration & Logic Testing
| Test Case | Description | Method |
|-----------|-------------|--------|
| Full Pipeline | Record -> Transcribe -> Extract -> View Ticket. | Manual/Agent Run |
| Error Handling | Test behavior when backend is offline. | Simulated |

## 4. Test Environment
- **URL:** Frontend (http://localhost:3000), Backend (http://127.0.0.1:8000)
- **Tools:** `curl`, Browser Control, `whisper` library.

## 5. Automation Strategy
- Use `curl` for immediate API smoke tests.
- Use `browser` tool for UI verification.
- Create automated test reports periodically.

---
*Created by QA Sub-Agent - 2026-03-01*
