# AcademeIQ

> **Tagline:** Your intelligent academic life agent  
> **Track:** Concierge Agents (Kaggle AI Agents: Intensive Vibe Coding Capstone)  
> **Stack:** FastAPI · React + Vite · Tailwind CSS · Gemini · Gmail/Calendar/Drive MCP · Railway · Vercel

AcademeIQ is a conversational AI agent that acts as a personal academic concierge. It connects to Gmail, Google Calendar, and Google Drive, reasons over your actual academic data, and acts on your behalf — always with your explicit approval before any write operation.

## Project Structure

```
academeiq/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── routes/
│       ├── services/
│       ├── models/
│       └── utils/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── .env.example
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       ├── hooks/
│       └── utils/
└── README.md
```

## Setup Instructions

### Backend
1. Navigate to the `backend/` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your keys.
5. Run the dev server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` (optional, default endpoints are set up).
4. Run the development server:
   ```bash
   npm run dev
   ```
