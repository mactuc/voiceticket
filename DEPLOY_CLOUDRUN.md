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

## 2. Setting Up Google Cloud SQL (PostgreSQL)
To ensure Jira connections and user data persist across Cloud Run instances, we use a managed PostgreSQL database.

1. Navigate to **[Cloud SQL](https://console.cloud.google.com/sql/instances)** in your Google Cloud Console.
2. Click **CREATE INSTANCE** and choose **PostgreSQL**.
3. Provide an Instance ID (e.g., `voiceticket-db`) and set a strong password for the default `postgres` user. Keep the password somewhere safe.
4. Choose the region that matches your Cloud Run deployment (e.g., `us-east1`). *Note: While not strictly required, keeping your database and Cloud Run service in the exact same region eliminates cross-region network egress costs and minimizes database query latency.*
5. Choose **Cloud SQL edition**: **Enterprise** and select the **Sandbox** or **Shared core** preset to minimize costs for your prototype.
6. Click **CREATE INSTANCE**. (This can take 5-10 minutes to provision).
7. Once created, click into the instance and locate your **Connection name** (format: `project-id:region:instance-id`).
8. On the left sidebar of the SQL instance, go to **Databases** and click **CREATE DATABASE**. Name it `voiceticket`.

---

## 3. Deploying the Backend
We establish the backend component strictly before the frontend component so its domain route generates effectively beforehand.

1. Navigate to **[Cloud Run](https://console.cloud.google.com/run)** locally inside your targeted Google context project.
2. Click **CREATE SERVICE** (or Edit your existing `voiceticket-backend` service).
3. If creating new: Select **Continuously deploy from a repository** -> **Connect GitHub** -> `mactuc/voiceticket`. Branch `^main$`. Build Type: **Dockerfile**. Source Location: `/backend/Dockerfile`.
4. Specify your Service Name: `voiceticket-backend`
5. Expand the **Container, Networking, Security** block:
6. Under the **Connections** tab:
   - Click **ADD CONNECTION** under Cloud SQL connections.
   - Select the Cloud SQL instance you created in Step 2. (This allows Cloud Run to securely bypass the database firewall).
7. Under the **Variables & Secrets** tab, set these variables:
   - `OPENROUTER_API_KEY`: <Your Secret API Key>
   - `JWT_SECRET`: <Secure String for encoding JWT Tokens>
   - `GOOGLE_CLIENT_ID`: <Google OAuth Identity Array>
   - `DATABASE_URL`: `postgresql://postgres:<YOUR_PASSWORD>@/voiceticket?host=/cloudsql/<YOUR_CONNECTION_NAME>`
     *(Replace `<YOUR_PASSWORD>` with the DB password, and `<YOUR_CONNECTION_NAME>` with the exact connection name from Step 2)*
   - `JIRA_CLIENT_ID`: <Your Atlassian App Client ID>
   - `JIRA_CLIENT_SECRET`: <Your Atlassian App Client Secret>
8. Click **CREATE** or **DEPLOY**.

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
