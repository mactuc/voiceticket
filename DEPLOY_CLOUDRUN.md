# Google Cloud Run Deployment Guide

This guide details how to securely deploy and manage the VoiceTicket dual-service application iteratively inside of Google Cloud Run using continuous deployment from GitHub.

## Architectural Note
Google Cloud Run maps directly to single autonomous microservices. Therefore, we deliberately deploy the VoiceTicket ecosystem as two structurally detached Cloud Run operations bound together strictly at the environment networking level.

---

## 1. Google OAuth Prerequisite Prep
Because you are exposing the frontend over a publicly accessible cloud URL, the original `http://localhost:3000` configuration inside the Google Cloud API Console must be extended locally:
1. Navigate to: `API & Services > Credentials`
2. Open your targeted OAuth 2.0 Web Client 
3. Within **Authorized JavaScript origins**, add your freshly generated Google Cloud Frontend URI (e.g. `https://voiceticket-frontend-xxxxxx.us-east1.run.app`). 
*(You must do this AFTER Phase 3 is completed when you officially have the URL)*

---

## 2. Deploying the Backend
We establish the backend component strictly before the frontend component so its domain route generates effectively beforehand.

1. Navigate to **[Cloud Run](https://console.cloud.google.com/run)** locally inside your targeted Google context project.
2. Click **CREATE SERVICE**.
3. Select **Continuously deploy from a repository** -> **Connect GitHub** -> `mactuc/voiceticket`.
4. Branch specification: `^main$`
5. In the Build Configuration sub-menu:
   - Build Type: **Dockerfile**
   - Source Location: `/backend/Dockerfile`
6. Specify your Service Name: `voiceticket-backend`
7. Ensure Authentication is definitively set to **Allow unauthenticated invocations**.
8. Expand the Container, Networking, and Security config block aggressively to configure your **Variables & Secrets**:
   - `OPENROUTER_API_KEY`: <Your Secret API Key>
   - `JWT_SECRET`: <Secure String for encoding JWT Tokens>
   - `GOOGLE_CLIENT_ID`: <Google OAuth Identity Array>
9. Click **CREATE**. Upon deployment finalizing fully (green hook), locate and store the output URL assigned format (`https://voiceticket-backend-...`).

---

## 3. Deploying the Frontend
1. Back onto the main **Cloud Run** page, click **CREATE SERVICE** again!
2. Execute the identical Source configurations recursively (`Github` > `mactuc/voiceticket` > `^main$`).
3. In the Build Configuration sub-menu:
   - Build Type: **Dockerfile**
   - Source Location: `/Dockerfile` (Leave at root)
4. Specify your Service Name: `voiceticket-frontend`
5. Authentication target: **Allow unauthenticated invocations**.
6. Drill into the Variables block and establish these two critically important dependencies:
   - `BACKEND_URL`: Paste the exact URL retrieved efficiently from Step 2. Do not use quotes and do not append a trailing slash.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Establish your identical matching array `your_key.apps.googleusercontent.com`
7. Click **CREATE**. 
8. The URL presented sequentially upon completion translates natively to the official entry point!

---

## 4. Managing Ongoing Deployments

Since we established strict continuous deployment from the GitHub target branch:
- Any standard `git push origin main` locally on your device pushes cleanly directly to the Google Cloud Run trigger natively!
- Cloud Build automatically intercepts webhook updates, rebuilds the container instances iteratively, and dynamically points HTTP traffic natively matching the newest revision utilizing zero-downtime routing natively.
- If you need to monitor or pause auto-scaling logic natively, refer dynamically straight inside the `Triggers` window configured directly underneath Cloud Build.
