# AcademeIQ — Your Intelligent Academic Concierge Agent

> **Concierge Agents Track** · Kaggle AI Agents Intensive Capstone (July 2026)  
> **Stack:** FastAPI · React + Vite (TypeScript) · Tailwind CSS · Gemini-2.5-Flash · Google Calendar/Gmail/Drive APIs · Railway · Vercel

---

## 1. Project Overview

### The Problem
University students manage their academic lives across fragmented, disconnected channels — student portals, Gmail, Google Calendar, and WhatsApp threads — without centralized intelligence. Passive tools like Notion and Todoist store details but lack contextual awareness, failing to alert users about scheduling conflicts, draft complex professor communications, or organize material proactively.

### The Solution
**AcademeIQ** is a conversational AI agent that acts as a proactive academic concierge. It connects securely to Gmail, Google Calendar, and Google Drive, reasoning over the student's actual academic data, and acts on their behalf. 

To ensure security, AcademeIQ implements a **Confirm-Before-Act** security protocol: no write operation is ever executed without the student's explicit approval through an interactive review modal.

---

## 2. System Architecture

```
                       ┌──────────────────────────────┐
                       │    React + Vite Frontend     │
                       │   (Zustand, Tailwind CSS)    │
                       └──────────────┬───────────────┘
                                      │ HTTPS / SSE
                                      ▼
                       ┌──────────────────────────────┐
                       │       FastAPI Backend        │
                       │     (In-Memory Session)      │
                       └──────┬───────────────┬───────┘
                              │               │
                              │ PGenAI SDK    │ Google API
                              ▼               ▼
                       ┌──────────────┐┌──────────────┐
                       │  Gemini 2.5  ││ Google APIs  │
                       │    Flash     ││ (Gmail, Cal,│
                       │  Reasoning   ││ Drive, etc.) │
                       └──────────────┘└──────────────┘
```

- **Frontend:** Single Page Application (SPA) built with React 18, Vite, TypeScript, and Tailwind CSS. Manages global session logs using Zustand.
- **Backend:** High-performance REST and Server-Sent Events (SSE) API built with FastAPI. Operates statelessly for privacy, utilizing signed server sessions to interact with Google.
- **Security Layer:** Intercepts write tool declarations requested by Gemini, caching them in the session state as `pending_actions` and returning them to the client for validation before executing.

---

## 3. Setup & How to Run Locally

### Environment Variables Configuration

Create a `.env` file inside `backend/` and a `.env` file inside `frontend/` using the templates below.

#### Backend Env (`backend/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:8000/auth/callback
SECRET_KEY=your_session_cookie_signer_key
FRONTEND_URL=http://localhost:5173
```

#### Frontend Env (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

### Installation & Launch

#### Step 1: Run the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

#### Step 2: Run the Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 4. Kaggle Course Concepts Coverage

AcademeIQ implements all 6 core concepts required for the **Concierge Agents Capstone Track**:

| Course Concept | Implementation & Code Location | Details |
|---|---|---|
| **1. MCP / API Tool Layer** | [google_api.py](file:///D:/Project/PROJECT/AcademeIQ/backend/app/services/google_api.py) | Wraps Google APIs (Gmail, Calendar, Drive) into callable methods. Includes developer fallback mock services. |
| **2. Gemini API / GenAI SDK** | [gemini.py](file:///D:/Project/PROJECT/AcademeIQ/backend/app/services/gemini.py) | Interfaces with `gemini-2.5-flash` using `google-genai` SDK. Orchestrates multi-turn loops and intent triage. |
| **3. Security Features** | [chat.py](file:///D:/Project/PROJECT/AcademeIQ/backend/app/routes/chat.py)<br>[Chat.tsx](file:///D:/Project/PROJECT/AcademeIQ/frontend/src/pages/Chat.tsx) | Implements "Confirm-Before-Act" interceptor. Write tools are blocked, queued as pending, and approved via the `ActionPreview` modal. Chronological audit entries logged on all actions. |
| **4. Deployability** | [main.py](file:///D:/Project/PROJECT/AcademeIQ/backend/main.py) | Configured with CORS allowance lists (Vercel production URL placeholder + localhost) and signed server cookies for seamless deployment. |
| **5. Agent Skills** | [dashboard.py](file:///D:/Project/PROJECT/AcademeIQ/backend/app/routes/dashboard.py) | Leverages Gemini for weekly briefing syntheses, bulk study plan generation, unread email classifications, and focus block setups. |
| **6. Vibe Coding** | [frontend/src/](file:///D:/Project/PROJECT/AcademeIQ/frontend/src/) | Dynamic dark-themed UI components, state machines, and real-time SSE stream listeners built via collaborative pair programming. |
