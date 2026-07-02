# AcademeIQ

> **Tagline:** Your intelligent academic life concierge agent  
> **Track:** Concierge Agents (Kaggle AI Agents: Intensive Vibe Coding Capstone)  
> **Stack:** FastAPI · React + Vite (TypeScript) · Tailwind CSS · Gemini-2.5-Flash · Gmail/Calendar/Drive APIs · SQLite/In-memory Caching

AcademeIQ is a conversational AI assistant that acts as a personal academic concierge. It connects to Google Calendar, Gmail, and Google Drive, reasons over your actual academic data, and acts on your behalf — always with your explicit approval before any write operation.

---

## Key Features

- **Google OAuth 2.0 Flow with Offline Access:** Connects securely to Google Accounts. It requests `access_type="offline"` and `prompt="consent"` to obtain a refresh token, allowing AcademeIQ to refresh expired access tokens automatically in the background.
- **Mock Developer Mode:** Fallback option is automatically used if Google Client credentials are not configured, enabling developer simulation with pre-configured mock student records.
- **Quota-Saving Local Dashboard:** Dashboard panels (`/api/deadlines` and `/api/email-digest`) extract dates, compute urgency, and summarize professor emails purely in Python using date arithmetic, regex patterns, and keyword triaging—completely bypassing Gemini API calls on page load.
- **Multi-Turn Chat Agent:** Uses Gemini 2.5 Flash for conversational intelligence and reads actual Calendar, Gmail, and Drive items in real-time through dynamic function calling.
- **In-Memory Cache (30 Min):** Caches API outputs in user sessions for 30 minutes. Clicking the manual **Sync** button forces a refresh, bypassing cache.
- **Real-Time Audit Log:** Transparently logs read/write events happening within the active session. Connected directly to both the Dashboard and Security Audit screen.

---

## Project Structure

```
academeiq/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── routes/
│       │   ├── auth.py          # Google OAuth Login & Callback
│       │   ├── chat.py          # SSE Streaming Chat & Gemini API
│       │   ├── dashboard.py     # Local Schedule, Deadlines & Gmail Digests
│       │   └── audit.py         # Session Audit Log Endpoint
│       ├── services/
│       │   ├── google_api.py    # Google API Wrapper & Mocks
│       │   └── gemini.py        # Gemini Client & Multi-Turn Tools
│       └── utils/
│           └── session.py       # Global In-Memory Session Store
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── components/          # Timeline, DeadlineCards & DigestCards
│       ├── pages/               # Dashboard, Chat & Security Audit Log
│       ├── store/               # Zustand Global Auth State
│       └── main.tsx
├── .gitignore                   # Extensively blocks envs, keys, and credentials
└── README.md
```

---

## Setup Instructions

### Environment Variables
Configure your environment variables in both `backend/.env` and `frontend/.env` (use `.env.example` templates).

#### Backend Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:8000/auth/callback
SESSION_SECRET_KEY=your_session_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### Backend Setup
1. Navigate to the `backend/` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build & run the Vite development server:
   ```bash
   npm run dev
   ```
