# AcademeIQ — Full Project Specification

> **Tagline:** Your intelligent academic life agent  
> **Track:** Concierge Agents (Kaggle AI Agents: Intensive Vibe Coding Capstone)  
> **Deadline:** July 6, 2026 at 11:59 PM PT  
> **Stack:** FastAPI · React + Vite · Tailwind CSS · Gemini · Gmail/Calendar/Drive MCP · Railway · Vercel

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System](#2-design-system)
3. [Feature Specifications](#3-feature-specifications)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Phase Breakdown](#7-phase-breakdown)
8. [GitHub Workflow](#8-github-workflow)
9. [Kaggle Submission Checklist](#9-kaggle-submission-checklist)

---

## 1. Project Overview

### Problem Statement

University students manage their academic lives across a fragmented set of disconnected tools — university portals, Gmail, Google Calendar, WhatsApp groups, and handwritten notes — with zero intelligent orchestration. The result is missed deadlines, reactive studying, and hours lost to administrative overhead that should be spent learning.

Existing tools like Notion, Todoist, and Google Calendar are passive. They store what you put in. They never warn you that you are behind. They never draft your professor's email. They never tell you that Thursday's deadline conflicts with your 3 back-to-back labs.

### Solution

AcademeIQ is a conversational AI agent that acts as a personal academic concierge. It connects to Gmail, Google Calendar, and Google Drive through MCP servers, reasons over your actual academic data using Gemini 2.0 Flash, and acts on your behalf — always with your explicit approval before any write operation.

### Core Value Proposition

- Reads your calendar, email, and Drive automatically
- Reasons over your academic situation intelligently
- Acts on your behalf (creates events, drafts emails, organizes files)
- Never writes anything without showing you exactly what it will do first
- Keeps a visible audit log of every action taken

---

## 2. Design System

### Philosophy

Professional, clean, and calm. This is a productivity tool for serious students, not a consumer app. The design should feel like a well-built SaaS dashboard — precise, trustworthy, and distraction-free. No gradients unless functional. No emojis in the UI. Icons only (Lucide React). Every element earns its place.

**Anti-patterns to avoid:**
- Pink or purple gradients
- Glassmorphism blur effects everywhere
- Emoji as UI elements
- Rounded-everything bubble aesthetic
- Comic Sans or display fonts used for body text
- Cluttered sidebars with too many options

---

### Color Palette

```
Primary Background:    #0F1117  (near-black, deep navy-slate)
Surface / Cards:       #1A1D27  (slightly lighter, card backgrounds)
Border / Dividers:     #2A2D3A  (subtle borders, input outlines)
Primary Accent:        #4F8EF7  (clear academic blue — trust, focus)
Accent Hover:          #6BA3FF  (lighter blue on hover states)
Success:               #34C77B  (green — confirms, completed actions)
Warning:               #F5A623  (amber — pending approvals, deadlines soon)
Danger:                #E05252  (red — overdue, errors)
Text Primary:          #F0F2F8  (near-white body text)
Text Secondary:        #8B90A7  (muted labels, timestamps, metadata)
Text Disabled:         #444860  (placeholder text, inactive states)
```

### Typography

```
Display Font:    "Inter" — weights 400/500/600/700
Mono Font:       "JetBrains Mono" — for code snippets, audit logs, timestamps
```

Both loaded via Google Fonts. No third-party font CDN that might be blocked.

**Type Scale:**
```
--text-xs:    11px / line-height 1.4  — timestamps, metadata
--text-sm:    13px / line-height 1.5  — secondary labels, captions
--text-base:  15px / line-height 1.6  — body text, chat messages
--text-lg:    18px / line-height 1.5  — section headers
--text-xl:    22px / line-height 1.3  — page titles
--text-2xl:   28px / line-height 1.2  — hero headings
```

### Spacing System (8px base grid)

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Border Radius

```
--radius-sm:  4px   — buttons, tags, badges
--radius-md:  8px   — cards, inputs, dropdowns
--radius-lg:  12px  — modals, panels
--radius-xl:  16px  — chat bubbles
```

### Shadows

```
--shadow-sm:  0 1px 3px rgba(0,0,0,0.4)
--shadow-md:  0 4px 12px rgba(0,0,0,0.3)
--shadow-lg:  0 8px 24px rgba(0,0,0,0.4)
```

---

### Logo & Favicon

- **Logo mark:** A stylized graduation cap merged with a neural/circuit node — representing intelligence + academia. SVG format. Designed in Figma or generated as SVG code.
- **Color:** Accent blue `#4F8EF7` on transparent background
- **Favicon:** 32x32 and 16x16 ICO versions of the logo mark
- **Browser tab:** Shows logo favicon + "AcademeIQ" text in the title tag
- **Navbar:** Logo SVG (24x24) + "AcademeIQ" wordmark in Inter 600 weight, side by side

---

### Navbar Specification

```
Height:          56px
Background:      #0F1117 with 1px bottom border in #2A2D3A
Left section:    Logo icon (24px) + "AcademeIQ" text (Inter 600, 16px, #F0F2F8)
Center section:  Navigation links — Dashboard · Chat · Audit Log · Settings
Right section:   User avatar (Google profile photo, 32px circle) + name
Position:        Fixed top, z-index 100
Backdrop:        No blur — solid background only
```

**Nav link styles:**
- Default: `#8B90A7`, no underline
- Hover: `#F0F2F8`, smooth color transition 150ms
- Active: `#4F8EF7` with a 2px bottom border in the same color

---

### Animation Guidelines

**Principles:** Purposeful and fast. Animations should confirm actions, guide attention, or communicate state — not entertain. Every animation under 300ms unless it is a page transition.

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page transitions | Fade + 8px upward slide | 200ms | ease-out |
| Card hover | Subtle border lightens to `#4F8EF7`, shadow deepens | 150ms | ease |
| Button hover | Background lightens 10% | 120ms | ease |
| Button press | Scale to 0.97 | 80ms | ease-in |
| Chat message appear | Fade in + 12px upward slide | 180ms | ease-out |
| Loading spinner | Rotating ring in accent blue | continuous | linear |
| Skeleton loaders | Shimmer from left to right, `#1A1D27` to `#2A2D3A` | 1.4s | ease-in-out, infinite |
| Confirm modal | Fade in + scale from 0.96 to 1.0 | 180ms | ease-out |
| Audit log entry | Slide in from left | 200ms | ease-out |
| Toast notification | Slide in from bottom-right | 200ms | ease-out, auto-dismiss 4s |

**Respect `prefers-reduced-motion`:** All animations wrapped in a media query check. Users with reduced motion get instant state changes only.

---

### Icon System

**Library:** Lucide React — consistent stroke-based icons, professional, not playful.

No emojis anywhere in the UI. Every icon must have an accessible `aria-label`.

| Use Case | Icon Name |
|---|---|
| Chat / Send | `MessageSquare`, `Send` |
| Calendar | `Calendar`, `CalendarClock` |
| Email | `Mail`, `MailOpen` |
| Drive / Files | `FolderOpen`, `FileText` |
| Deadline | `AlertCircle`, `Clock` |
| Study plan | `BookOpen`, `LayoutList` |
| Security / Audit | `Shield`, `ClipboardList` |
| Settings | `Settings` |
| User | `User`, `LogOut` |
| Loading | `Loader2` (spinning) |
| Success | `CheckCircle2` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |
| Approve action | `CheckSquare` |
| Reject action | `XSquare` |

---

### Component Library

All components built custom with Tailwind. No shadcn/ui, no MUI, no Chakra — keeps the bundle clean and the look original.

**Core components to build:**
- `Button` — variants: primary, secondary, ghost, danger
- `Input` — text, with icon slot left/right
- `Card` — surface container with optional header
- `Badge` — status indicators (due soon, overdue, pending, done)
- `Modal` — confirmation dialogs for write actions
- `Toast` — non-blocking notifications
- `Skeleton` — loading placeholders matching content shape
- `Spinner` — inline loading indicator
- `ChatBubble` — user and agent message variants
- `AuditEntry` — timestamped action log entry
- `DeadlineCard` — deadline with priority, subject, days remaining
- `ActionPreview` — shows exactly what the agent will do before confirmation

---

## 3. Feature Specifications

---

### Feature 1: Conversational Chat Interface

**What it does:**
The primary interface of AcademeIQ. A persistent chat window where the user types natural language requests and the agent responds with text, structured cards, or action previews. The agent maintains conversation context within a session.

**User interactions:**
- Type a message and press Enter or click Send
- See a typing indicator while the agent reasons
- Receive text responses, structured data cards, or action confirmation modals
- Click Approve / Reject on any proposed write action
- Start a new conversation session with the New Chat button

**Technical implementation:**
- Frontend sends POST to `/api/chat` with message text + conversation history array
- Backend passes history + new message to Gemini via the Gemini Python SDK
- Gemini determines intent and selects appropriate tool (Gmail MCP, Calendar MCP, Drive MCP, or none)
- Response streamed back via Server-Sent Events (SSE) so messages appear word by word
- Frontend renders response as markdown (using `react-markdown` with custom renderers for cards)
- Conversation history stored in React state (not persisted — session only for privacy)

**Agent system prompt (summary):**
- Identity: You are AcademeIQ, an academic concierge agent
- Never write (send email, create event, modify Drive) without presenting a preview and receiving explicit approval
- Always extract and structure deadlines, emails, and events into readable cards
- When uncertain, ask for clarification rather than guessing
- Speak like a knowledgeable peer, not a corporate assistant

**UI layout:**
```
┌─────────────────────────────────────┐
│  Chat history (scrollable)          │
│  ┌──────────────────────────────┐   │
│  │ User message bubble (right)  │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │ Agent response (left)        │   │
│  │ [Structured card if needed]  │   │
│  └──────────────────────────────┘   │
├─────────────────────────────────────┤
│  [Input box]          [Send button] │
└─────────────────────────────────────┘
```

---

### Feature 2: Smart Deadline Intelligence

**What it does:**
Scans the user's Google Calendar and Gmail (professor emails, announcements) to extract all academic deadlines, submission dates, exam schedules, and viva dates. Presents them in a prioritized dashboard view with urgency indicators.

**User interactions:**
- View the Deadlines panel on the Dashboard
- See deadlines grouped by: Overdue, Due in 3 days, This week, Later
- Click a deadline to see its source (which calendar event or email it came from)
- Ask in chat: *"What are my deadlines this week?"* — agent reads from calendar and Gmail

**Technical implementation:**
- On Dashboard load, backend calls Calendar MCP to fetch events for next 30 days
- Separately calls Gmail MCP with query `"assignment OR deadline OR submission OR exam"` filtered to last 30 days
- Gemini processes both datasets to extract deadline-relevant items and deduplicates overlaps
- Returns structured JSON array: `{ title, subject, due_date, source, urgency_level }`
- Frontend renders `DeadlineCard` components sorted by urgency
- Urgency computed as: `overdue` / `critical (≤3 days)` / `upcoming (≤7 days)` / `later`
- Color coded: red / amber / blue / muted

**MCP calls used:**
- `calendar.events.list` — fetch upcoming events
- `gmail.messages.list` + `gmail.messages.get` — fetch and read relevant emails

---

### Feature 3: Personalized Study Plan Generator

**What it does:**
Generates a day-by-day study plan for a subject or exam given the user's deadline and available hours per day. Auto-creates time blocks in Google Calendar. Requires user confirmation before any calendar writes.

**User interactions:**
- Type: *"Create a 5-day study plan for my Networks exam on Friday"*
- Agent asks clarifying questions if needed: *"How many hours per day can you study? Any days you want to skip?"*
- Agent presents a preview of the plan as a structured table
- User clicks Approve — agent creates all calendar events via Calendar MCP
- User clicks Edit — can modify before approving
- User clicks Reject — nothing is written

**Technical implementation:**
- Intent detected by Gemini: `{ type: "study_plan", subject, deadline_date, hours_per_day }`
- Backend fetches existing calendar events for the date range to avoid conflicts
- Gemini generates plan JSON: `[{ date, time_start, time_end, topic, description }]`
- Frontend renders plan as a visual table in the ActionPreview modal
- On approval, backend loops through plan items and calls `calendar.events.create` for each
- Bulk creation handled with sequential MCP calls (not parallel, to maintain order)
- Audit log records each calendar event created with title, time, and status

**Calendar event format:**
```
Title:       [AcademeIQ] Study: Networks — OSI Model
Description: Generated by AcademeIQ study plan. Topic: OSI Model layers and protocols.
Start:       2026-07-02T19:00:00
End:         2026-07-02T21:00:00
Color:       Blueberry (calendar color ID 9)
```

---

### Feature 4: Professor Email Triage

**What it does:**
Reads the user's Gmail inbox and extracts all emails from professors and university domains. Surfaces announcements, deadline changes, action items, and important updates as a clean digest — not a raw inbox view.

**User interactions:**
- View the Email Digest panel on the Dashboard
- See emails grouped by: Action Required, Announcements, FYI
- Click an email summary to expand the full extracted content
- Ask in chat: *"Any announcements from my professors this week?"*
- Ask: *"What did I miss while I was sick Thursday and Friday?"*

**Technical implementation:**
- Gmail MCP called with query filtering for professor/university domains
- Gemini reads each email body and classifies it: `action_required` / `announcement` / `fyi`
- Extracts: sender name, subject, key content summary, any mentioned dates or deadlines
- Returns structured digest: `{ category, sender, subject, summary, dates_mentioned, email_id }`
- Frontend groups by category and renders as expandable cards
- Full email body never shown by default — only Gemini's extracted summary (privacy preserving)

**MCP calls used:**
- `gmail.messages.list` with query `"from:(professor OR university OR edu)"` OR user-configured sender list
- `gmail.messages.get` for full body of relevant messages

---

### Feature 5: Academic Email Drafter

**What it does:**
Drafts professionally worded emails for common academic scenarios. Never sends without explicit user approval and preview. User can edit the draft before approving.

**Supported scenarios (built-in templates + Gemini customization):**
- Extension request for an assignment
- Absence notification and catching up
- Clarification question about course material
- Group project coordination email to teammates
- Requesting feedback on submitted work
- Appointment booking with professor / office hours

**User interactions:**
- Type: *"Draft an email to Dr. Ahmed asking for a 2-day extension on the CV assignment"*
- Agent generates draft and shows it in an ActionPreview modal with: To, Subject, Body
- User can click Edit to modify any field inline
- User clicks Send — agent calls Gmail MCP to send
- User clicks Save as Draft — agent saves to Gmail drafts folder
- User clicks Reject — nothing happens

**Technical implementation:**
- Intent: `{ type: "draft_email", scenario, recipient_name, subject_context, details }`
- Gemini generates email using prompt with user's academic context + scenario details
- Draft rendered in a styled email preview component (not raw text)
- On Send approval: `gmail.messages.send` via Gmail MCP
- On Save Draft approval: `gmail.drafts.create` via Gmail MCP
- Audit log records: action type, recipient, subject, timestamp, approved/rejected

**Email quality rules enforced in Gemini prompt:**
- Formal academic tone
- Clear subject line following: `[Course Code] — Brief description`
- No slang, no emojis
- Concise — under 150 words unless the scenario requires more
- Ends with proper sign-off and student name/roll number placeholder

---

### Feature 6: Focus Block Scheduler

**What it does:**
Analyzes the user's calendar for unprotected or fragmented time. Identifies gaps where study or deep work sessions can be added. Suggests focus blocks and creates them with user approval.

**User interactions:**
- Ask: *"Block 2 hours of study time every evening this week"*
- Ask: *"Find me free time this week for FYP work"*
- Ask: *"Protect my mornings from meetings for the next 3 days"*
- Agent shows a preview of proposed time blocks
- User approves all, selects specific ones, or rejects

**Technical implementation:**
- Fetch next 7 days of calendar events via Calendar MCP
- Gemini analyzes schedule: identifies classes, meetings, and free windows
- Generates suggested blocks avoiding conflicts: `{ date, start_time, end_time, label }`
- User sees preview as a simple weekly grid in the modal
- On approval, creates events with label `[AcademeIQ] Focus: {subject}`
- Bulk creation same pattern as study plan

---

### Feature 7: Weekly Academic Briefing

**What it does:**
On demand (or auto-triggered Monday morning if user enables it), generates a comprehensive weekly briefing covering: upcoming deadlines, pending emails requiring action, scheduled study sessions, and a reflection on last week's planned vs completed sessions.

**User interactions:**
- Ask: *"Give me my weekly briefing"* or *"What does this week look like?"*
- Dashboard shows a briefing card if it is Monday morning
- Briefing rendered as a structured document, not raw chat text
- User can export briefing as a Google Doc to their Drive (with approval)

**Technical implementation:**
- Parallel MCP calls: Calendar events for next 7 days + Gmail unread/flagged + Drive recent files
- Gemini synthesizes all three into a structured briefing JSON
- Sections: `{ deadlines[], email_actions[], study_sessions[], weekly_goals[], notes }`
- Frontend renders as a formatted briefing card with section headers and icons
- Export to Drive: `drive.files.create` with markdown content converted to Google Doc format

---

### Feature 8: Security Layer — Confirm Before Act

**What it does:**
Every write operation (send email, create calendar event, modify Drive file) is intercepted before execution and presented to the user as an ActionPreview. Nothing is written to any Google service without explicit user approval in the current session.

**Architecture:**

```
Agent decides to write
        ↓
Write blocked by Security Layer
        ↓
ActionPreview modal shown to user
  - Action type (Send Email / Create Event / Save File)
  - Exact content that will be written
  - Which Google service will be affected
  - Approve / Edit / Reject buttons
        ↓
User clicks Approve
        ↓
MCP write call executed
        ↓
Audit Log entry created
```

**Frontend component: ActionPreview Modal**
- Shows above the chat, blocking interaction until resolved
- Title: clear action description (e.g., "Create 5 Calendar Events")
- Body: preview of exact content formatted appropriately
- Footer: Approve (primary blue button) · Edit · Reject (ghost button)
- Cannot be dismissed by clicking outside — must explicitly choose

**Backend enforcement:**
- All MCP write tool calls tagged as `requires_confirmation: true`
- Backend returns a `pending_action` object to frontend instead of executing
- Frontend stores pending action in state
- On approval, frontend sends `POST /api/actions/confirm` with `action_id`
- Backend then executes the MCP write call

---

### Feature 9: Audit Log

**What it does:**
A chronological log of every action AcademeIQ has taken — reads and writes — visible to the user at all times. Provides full transparency into what the agent has done on the user's behalf.

**User interactions:**
- Navigate to the Audit Log page from the navbar
- See a reverse-chronological list of all actions in the current session
- Each entry shows: timestamp, action type, description, status (approved/rejected/auto)
- Filter by: All · Writes · Reads · Rejected
- Click any entry to expand full details

**Entry format:**
```
[2026-07-02 14:32:11]  CREATE_CALENDAR_EVENT  ✓ Approved
  Title: [AcademeIQ] Study: Computer Vision — Feature Detection
  Time:  Thursday Jul 3, 7:00 PM – 9:00 PM
  Calendar: Primary

[2026-07-02 14:28:05]  READ_GMAIL  ● Auto
  Query: assignment OR deadline — last 30 days
  Results: 12 emails processed
```

**Technical implementation:**
- Backend maintains an in-memory audit log per session (list of dicts)
- Every MCP call (read or write) appends to the log with timestamp, tool, params, result status
- `GET /api/audit` returns the full log for the session
- Frontend polls every 10 seconds or updates via SSE alongside chat responses
- Log displayed using `AuditEntry` component with monospace font for technical details

---

### Feature 10: Dashboard

**What it does:**
The landing page after login. Shows a quick-glance overview of the user's academic situation without requiring any chat interaction.

**Sections:**
1. **Today's Schedule** — Timeline view of today's calendar events (read-only)
2. **Upcoming Deadlines** — Top 5 most urgent deadlines with urgency badges
3. **Email Actions** — Count of unread emails from professors requiring action
4. **Recent Agent Activity** — Last 3 audit log entries
5. **Quick Actions** — Shortcut buttons: *Get Weekly Briefing · Schedule Study Time · Check Deadlines*

**Technical implementation:**
- Dashboard loads call 3 endpoints in parallel: `/api/deadlines`, `/api/email-digest`, `/api/audit`
- Each section shows a skeleton loader while its data loads
- Data cached in React state for the session — refreshes on manual reload or after any write action
- Quick Action buttons send pre-filled messages to the chat interface

---

## 4. Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                      │
│              (Vercel · TypeScript · Tailwind CSS)            │
│                                                              │
│  Pages: Dashboard · Chat · Audit Log · Settings              │
│  State: Zustand (global) + React Query (server state)        │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS REST + SSE
┌───────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                            │
│                 (Railway · Python 3.11)                       │
│                                                              │
│  Routes: /api/chat · /api/deadlines · /api/email-digest      │
│          /api/study-plan · /api/actions/confirm · /api/audit │
│  Auth:   Google OAuth 2.0 (via authlib)                      │
│  Session: Server-side session store (Redis or in-memory)     │
└──────┬───────────────────────────────────┬────────────────────┘
       │                                   │
┌──────▼──────────┐             ┌──────────▼──────────────────┐
│   Gemini API    │             │      MCP Tool Layer         │
│ (google-genai)  │             │                             │
│                 │             │  Gmail MCP                  │
│ Model:          │             │  Google Calendar MCP        │
│ gemini-2.0-     │             │  Google Drive MCP           │
│ flash           │             │                             │
│                 │             │  Called via:                │
│ Role: reasoning,│             │  google-auth + googleapis   │
│ planning,       │             │  Python client              │
│ drafting,       │             │                             │
│ extraction      │             │  All writes require         │
└─────────────────┘             │  confirmed=True flag        │
                                └─────────────────────────────┘
```

### Frontend Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | Core framework + build tool |
| TypeScript | Type safety across components |
| Tailwind CSS v3 | Utility-first styling |
| Zustand | Lightweight global state (auth, audit log, session) |
| React Query (TanStack) | Server state, caching, background refresh |
| React Router v6 | Client-side routing with page transitions |
| react-markdown | Render agent markdown responses |
| Lucide React | Icon system |
| Framer Motion | Page transitions and animation primitives |
| Axios | HTTP client with interceptors |

### Backend Tech Stack

| Tool | Purpose |
|---|---|
| FastAPI | Main API framework |
| Python 3.11 | Runtime |
| google-genai SDK | Gemini API integration |
| authlib | Google OAuth 2.0 flow |
| googleapis Python client | Gmail / Calendar / Drive API calls |
| python-dotenv | Environment variable management |
| uvicorn | ASGI server |
| pydantic v2 | Request/response validation |

### Environment Variables

**Backend (.env):**
```
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
SECRET_KEY=                    # FastAPI session signing
FRONTEND_URL=
```

**Frontend (.env):**
```
VITE_API_BASE_URL=
```

**Never commit .env files. Add to .gitignore immediately.**

---

## 5. Database Schema

AcademeIQ is intentionally **stateless by design** — no user data is stored in a database. This is a core security and privacy feature.

All data stays in:
- The user's own Google account (Calendar, Gmail, Drive)
- In-memory session state on the backend (cleared on session end)
- React component state on the frontend (cleared on page close)

This means:
- No database to breach
- No user data stored on AcademeIQ servers
- Full compliance with Google's OAuth data policies
- Session audit log lost on logout (by design — document this as a security choice)

**Session state (in-memory, backend):**
```python
session = {
    "user_id": str,
    "google_tokens": { "access_token": str, "refresh_token": str },
    "audit_log": List[AuditEntry],
    "pending_actions": Dict[str, PendingAction],
    "conversation_history": List[Message]
}
```

---

## 6. API Specification

### POST /api/chat
Send a message to the agent.

**Request:**
```json
{
  "message": "What are my deadlines this week?",
  "session_id": "abc123"
}
```

**Response (SSE stream):**
```
data: {"type": "text", "content": "Let me check your calendar..."}
data: {"type": "text", "content": " Here are your upcoming deadlines:"}
data: {"type": "card", "card_type": "deadline_list", "data": [...]}
data: {"type": "done"}
```

---

### GET /api/deadlines
Fetch all upcoming deadlines from Calendar + Gmail.

**Response:**
```json
{
  "deadlines": [
    {
      "id": "evt_123",
      "title": "CV Assignment Submission",
      "subject": "Computer Vision",
      "due_date": "2026-07-04T23:59:00",
      "urgency": "critical",
      "source": "calendar",
      "source_id": "google_event_id"
    }
  ]
}
```

---

### GET /api/email-digest
Fetch professor email triage digest.

**Response:**
```json
{
  "digest": [
    {
      "id": "msg_456",
      "category": "action_required",
      "sender": "Dr. Khalid Ahmed",
      "subject": "Lab Report Deadline Change",
      "summary": "Lab report deadline moved to July 5th at 11:59 PM",
      "dates_mentioned": ["2026-07-05"],
      "email_id": "gmail_message_id"
    }
  ]
}
```

---

### POST /api/study-plan
Generate a study plan.

**Request:**
```json
{
  "subject": "Knowledge Based Systems",
  "exam_date": "2026-07-08",
  "hours_per_day": 2,
  "skip_days": ["2026-07-05"],
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "action_id": "act_789",
  "requires_confirmation": true,
  "action_type": "CREATE_CALENDAR_EVENTS",
  "preview": {
    "events": [
      {
        "title": "[AcademeIQ] Study: KBS — Expert Systems",
        "start": "2026-07-03T19:00:00",
        "end": "2026-07-03T21:00:00"
      }
    ]
  }
}
```

---

### POST /api/actions/confirm
Approve or reject a pending write action.

**Request:**
```json
{
  "action_id": "act_789",
  "decision": "approved",
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "status": "executed",
  "result": "5 calendar events created successfully",
  "audit_entry_id": "aud_101"
}
```

---

### GET /api/audit
Fetch audit log for the session.

**Response:**
```json
{
  "entries": [
    {
      "id": "aud_101",
      "timestamp": "2026-07-02T14:32:11Z",
      "action_type": "CREATE_CALENDAR_EVENTS",
      "description": "Created 5 study plan events for KBS exam",
      "status": "approved",
      "details": { "events_created": 5, "date_range": "Jul 3–7" }
    }
  ]
}
```

---

## 7. Phase Breakdown

Each phase is a working, deployable increment. Each phase ends with a GitHub push to a dedicated branch, then merges to `main` only when stable.

---

### Phase 0 — Repository & Project Setup
**Branch:** `phase/0-setup`  
**Goal:** Clean, professional repo foundation before any code is written  
**Estimated time:** 2–3 hours

**Tasks:**
- [ ] Create GitHub repo: `academeiq`
- [ ] Initialize with README.md (project description, setup instructions placeholder)
- [ ] Add `.gitignore` (Python, Node, .env files)
- [ ] Set up monorepo structure:
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
- [ ] Backend: create virtual environment, install FastAPI, uvicorn, pydantic, python-dotenv
- [ ] Frontend: `npm create vite@latest frontend -- --template react-ts`, install Tailwind, Lucide, React Router, Zustand, React Query, Framer Motion, Axios
- [ ] Set up Tailwind config with custom design tokens (colors, fonts, spacing from Section 2)
- [ ] Add Google Fonts import (Inter + JetBrains Mono) in `index.html`
- [ ] Add favicon + browser tab title "AcademeIQ"
- [ ] Create logo SVG and add to `public/` folder
- [ ] Verify: `npm run dev` and `uvicorn main:app --reload` both start without errors
- [ ] Push to `phase/0-setup`, merge to `main`

**Deliverable:** Empty but professionally structured repo, both servers start, fonts and favicon load in browser.

---

### Phase 1 — Auth & Shell
**Branch:** `phase/1-auth-shell`  
**Goal:** Working Google OAuth login, navbar, routing, and empty page shells  
**Estimated time:** 4–6 hours

**Tasks:**
- [ ] Backend: implement Google OAuth 2.0 flow (`/auth/login`, `/auth/callback`, `/auth/logout`)
- [ ] Backend: session management with signed cookies (use `itsdangerous` or FastAPI's session middleware)
- [ ] Backend: `/auth/me` endpoint returning user profile (name, email, avatar)
- [ ] Frontend: Login page — centered card, AcademeIQ logo, "Sign in with Google" button (no email/password form)
- [ ] Frontend: OAuth redirect flow connected to backend
- [ ] Frontend: Auth state in Zustand (`user`, `isAuthenticated`, `isLoading`)
- [ ] Frontend: Protected routes — redirect to login if not authenticated
- [ ] Frontend: Navbar component (logo, nav links, user avatar, logout)
- [ ] Frontend: Page shells — Dashboard, Chat, Audit Log, Settings (empty but routed)
- [ ] Frontend: Page transition animations (Framer Motion, fade + slide)
- [ ] Frontend: Loading skeleton on auth check
- [ ] Test: Login → see navbar → navigate between pages → logout → redirected to login

**Deliverable:** Full auth flow working. Navbar renders. Routes work. Looks like AcademeIQ, not a boilerplate.

---

### Phase 2 — Chat Interface & Gemini Integration
**Branch:** `phase/2-chat-gemini`  
**Goal:** Working chat that connects to Gemini and streams responses  
**Estimated time:** 6–8 hours

**Tasks:**
- [ ] Backend: `POST /api/chat` endpoint
- [ ] Backend: Gemini SDK integration with system prompt
- [ ] Backend: SSE streaming response implementation
- [ ] Backend: Conversation history management in session
- [ ] Backend: Intent classification in Gemini response (plain text vs structured card vs action preview)
- [ ] Frontend: Chat page UI — message history, input box, send button
- [ ] Frontend: SSE client to receive streaming responses
- [ ] Frontend: Typing indicator (animated dots) while agent is responding
- [ ] Frontend: ChatBubble components for user and agent messages
- [ ] Frontend: Markdown rendering for agent responses (react-markdown)
- [ ] Frontend: Auto-scroll to latest message
- [ ] Frontend: New Chat button clears conversation history
- [ ] Test: Type a message, see it appear, agent responds with streaming text

**Deliverable:** Functional chat. Gemini responds. Streaming works. UI looks production-grade.

---

### Phase 3 — MCP Tool Integration
**Branch:** `phase/3-mcp-tools`  
**Goal:** Agent can read from Gmail, Calendar, and Drive via MCP  
**Estimated time:** 8–10 hours

**Tasks:**
- [ ] Backend: Gmail MCP service — `list_messages`, `get_message`, `search_messages`
- [ ] Backend: Calendar MCP service — `list_events`, `get_event`
- [ ] Backend: Drive MCP service — `list_files`, `get_file`, `search_files`
- [ ] Backend: Tool definitions passed to Gemini (function calling format)
- [ ] Backend: Tool execution router — when Gemini calls a tool, execute MCP call and return result
- [ ] Backend: Gemini multi-turn tool use loop (call tool → get result → continue reasoning)
- [ ] Backend: `GET /api/deadlines` endpoint using Calendar + Gmail MCP
- [ ] Backend: `GET /api/email-digest` endpoint using Gmail MCP
- [ ] Frontend: Dashboard Deadlines panel with skeleton → data → DeadlineCard components
- [ ] Frontend: Dashboard Email Digest panel with expandable entries
- [ ] Frontend: Dashboard Today's Schedule panel (timeline view)
- [ ] Test: Ask "What are my deadlines this week?" — agent reads calendar and replies with structured data

**Deliverable:** Agent reads from all three Google services. Dashboard panels load real data.

---

### Phase 4 — Security Layer & Write Actions
**Branch:** `phase/4-security-writes`  
**Goal:** All write operations intercepted, previewed, confirmed before execution  
**Estimated time:** 6–8 hours

**Tasks:**
- [ ] Backend: Write MCP services — `create_event`, `send_email`, `create_draft`, `save_to_drive`
- [ ] Backend: PendingAction model with `action_id`, `action_type`, `preview`, `status`
- [ ] Backend: Security interceptor — any write call generates a `pending_action` instead of executing
- [ ] Backend: `POST /api/actions/confirm` — executes or cancels a pending action
- [ ] Backend: `POST /api/study-plan` endpoint
- [ ] Backend: Study plan generation via Gemini + Calendar conflict checking
- [ ] Frontend: ActionPreview modal component
- [ ] Frontend: Modal triggered when agent response contains a `pending_action`
- [ ] Frontend: Preview rendering for each action type (event list, email preview, file save)
- [ ] Frontend: Approve / Edit / Reject buttons with loading state on approve
- [ ] Frontend: Toast notification on successful action execution
- [ ] Test: Ask to create a study plan → see preview modal → approve → events appear in Google Calendar

**Deliverable:** Full confirm-before-act security architecture working. Write actions execute only after approval.

---

### Phase 5 — Audit Log & Briefing
**Branch:** `phase/5-audit-briefing`  
**Goal:** Audit log page working, weekly briefing feature, remaining agent features  
**Estimated time:** 4–6 hours

**Tasks:**
- [ ] Backend: Audit log service — append on every MCP call, return via `GET /api/audit`
- [ ] Backend: Weekly briefing endpoint `GET /api/briefing` — parallel MCP calls + Gemini synthesis
- [ ] Backend: Email drafter intent handler in chat
- [ ] Backend: Focus block scheduler intent handler in chat
- [ ] Frontend: Audit Log page — reverse-chronological list, filter tabs, AuditEntry components
- [ ] Frontend: SSE update to push new audit entries to frontend in real time
- [ ] Frontend: Dashboard Recent Activity panel connected to audit log
- [ ] Frontend: Weekly Briefing card component (rendered on demand or Monday auto)
- [ ] Frontend: Dashboard Quick Actions buttons
- [ ] Frontend: Settings page — user profile display, OAuth scope transparency, logout
- [ ] Test: Take several actions → check audit log shows all of them with correct status

**Deliverable:** Audit log fully visible. Briefing generates correctly. All 10 features working.

---

### Phase 6 — Polish, Deploy & Demo Prep
**Branch:** `phase/6-polish-deploy`  
**Goal:** Production-ready deployment, video-ready demo, Kaggle submission assets  
**Estimated time:** 6–8 hours

**Tasks:**
- [ ] UI audit — check all pages on 1280px, 1024px, 768px widths
- [ ] Add `prefers-reduced-motion` media query to all animations
- [ ] Verify all icons have aria-labels
- [ ] Error states — what happens when MCP call fails (show error toast, log to audit)
- [ ] Empty states — what renders when there are no deadlines, no emails
- [ ] Backend error handling — try/except on all MCP calls with meaningful error messages
- [ ] CORS configuration — restrict to Vercel frontend URL only
- [ ] Deploy backend to Railway with environment variables set
- [ ] Deploy frontend to Vercel with `VITE_API_BASE_URL` pointing to Railway
- [ ] Test full flow on production URLs
- [ ] Write README.md — problem, solution, architecture diagram, setup instructions, deployment guide
- [ ] Record YouTube video (5 min max) — see script outline below
- [ ] Write Kaggle writeup (under 2,500 words)
- [ ] Create architecture diagram image for writeup
- [ ] Submit on Kaggle before deadline

**Deliverable:** Live at Vercel URL. Video published. Kaggle writeup submitted.

---

## 8. GitHub Workflow

### Branch Strategy
```
main                    ← stable, always deployable
├── phase/0-setup
├── phase/1-auth-shell
├── phase/2-chat-gemini
├── phase/3-mcp-tools
├── phase/4-security-writes
├── phase/5-audit-briefing
└── phase/6-polish-deploy
```

### Commit Message Convention
```
feat: add Gmail MCP message search
fix: resolve Calendar event conflict detection bug
style: update deadline card urgency colors
docs: add setup instructions to README
test: verify study plan generation with 3-day range
chore: update requirements.txt
```

### Phase Completion Checklist (before merging to main)
- [ ] All features in this phase manually tested
- [ ] No console errors in browser
- [ ] No unhandled exceptions in backend logs
- [ ] .env files NOT committed
- [ ] README updated with any new setup steps
- [ ] Branch merged via PR (even if solo — keeps history clean)

---

## 9. Kaggle Submission Checklist

### Required Assets
- [ ] GitHub repo public with complete code
- [ ] README.md with problem, solution, architecture, setup instructions
- [ ] Live demo URL (Vercel frontend)
- [ ] YouTube video ≤ 5 minutes
- [ ] Kaggle Writeup ≤ 2,500 words with cover image
- [ ] Track selected: Concierge Agents

### Video Script Outline (5 minutes)
```
0:00–0:30  Hook — show the problem (fragmented student life, calendar chaos)
0:30–1:00  Introduce AcademeIQ — what it does, who it's for
1:00–1:45  Architecture diagram — MCP servers, Gemini, security layer
1:45–3:30  Live demo:
           - Login with Google
           - Dashboard loads with real deadlines and email digest
           - Ask "What are my deadlines this week?" → agent responds
           - Ask for a study plan → confirm modal → events created in real Calendar
           - Show audit log with all actions taken
3:30–4:15  Antigravity segment — show vibe coding the UI in Antigravity
4:15–4:45  Course concepts covered (MCP, Gemini, Security, Deployability, Agent Skills, Antigravity)
4:45–5:00  Closing — repo link, what's next, call to try it
```

### Kaggle Course Concepts Coverage
| Concept | Where Demonstrated | Phase Built |
|---|---|---|
| MCP Server | Gmail + Calendar + Drive in backend code | Phase 3 |
| Gemini API | Chat, planning, extraction, drafting | Phase 2 |
| Security Features | Confirm-before-act, audit log, OAuth scopes | Phase 4 |
| Deployability | Railway + Vercel live deployment | Phase 6 |
| Agent Skills | Study planner, email triage, briefing skills | Phase 5 |
| Antigravity | UI built via vibe coding (shown in video) | Phase 1 + 6 |

All 6 concepts demonstrated. ✓

---

*AcademeIQ — Built for the Kaggle AI Agents: Intensive Vibe Coding Capstone, July 2026*  
*Track: Concierge Agents*
