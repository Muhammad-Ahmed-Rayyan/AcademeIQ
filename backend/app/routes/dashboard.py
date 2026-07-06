import datetime
import re
import json
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.services.google_api import GoogleApiService

from app.utils.session import log_audit_action, get_or_create_session

router = APIRouter(prefix="/api", tags=["dashboard"])

def extract_email_body(msg: dict) -> str:
    """
    Safely extracts and decodes the plaintext body of a Gmail message.
    """
    payload = msg.get("payload", {})
    body_data = payload.get("body", {}).get("data")
    if body_data:
        import base64
        try:
            return base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
        except Exception:
            return body_data
            
    parts = payload.get("parts", [])
    for part in parts:
        if part.get("mimeType") == "text/plain":
            data = part.get("body", {}).get("data")
            if data:
                import base64
                try:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                except Exception:
                    return data
                    
    return msg.get("snippet", "")

def get_google_service(request: Request) -> GoogleApiService:
    """
    Helper to instantiate GoogleApiService based on current user session.
    """
    user = request.session.get("user", {})
    google_token = request.session.get("google_token", {})
    
    is_mock = user.get("provider", "mock") == "mock" or not google_token.get("access_token")
    
    return GoogleApiService(google_token=google_token, is_mock=is_mock)

@router.get("/schedule/today")
async def get_today_schedule(request: Request):
    """
    Fetches today's schedule events from Calendar, supporting both timed and all-day events.
    Computes date matching using the user's system timezone.
    """
    try:
        service = get_google_service(request)
        log_audit_action(request, "READ_CALENDAR", "Dashboard: Retrieved today's class schedule", status="auto", details="Loaded Today's Schedule panel data")
        events = service.list_calendar_events()
        
        # Filter events happening today
        now = datetime.datetime.now()
        today_date_str = now.strftime("%Y-%m-%d")
        today_events = []
        
        for event in events:
            start = event.get("start", {})
            start_val = start.get("dateTime") or start.get("date")
            if not start_val:
                continue
            
            # Extract date in system local timezone
            event_date_str = ""
            if "T" in start_val:
                try:
                    # Timezone aware parsing
                    dt = datetime.datetime.fromisoformat(start_val.replace("Z", "+00:00"))
                    local_dt = dt.astimezone() # converts to local system timezone
                    event_date_str = local_dt.strftime("%Y-%m-%d")
                except Exception as ex:
                    print(f"Error parsing event datetime {start_val}: {ex}")
                    event_date_str = start_val.split("T")[0]
            else:
                # All-day event (YYYY-MM-DD)
                event_date_str = start_val
            
            if service.is_mock or event_date_str == today_date_str:
                start_time = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date") or ""
                end_time = event.get("end", {}).get("dateTime") or event.get("end", {}).get("date") or ""
                today_events.append({
                    "id": event.get("id"),
                    "title": event.get("summary", "Untitled Session"),
                    "description": event.get("description", ""),
                    "start_time": start_time,
                    "end_time": end_time,
                    "category": "Class" if "Class" in event.get("summary", "") else "Lab" if "Lab" in event.get("summary", "") else "Study Block"
                })
        
        return {"schedule": today_events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deadlines")
async def get_deadlines(request: Request, sync: bool = False):
    """
    Scans Calendar to extract academic deadlines and computes urgency.
    Caches results in memory for 30 minutes unless sync is requested.
    """
    try:
        session = get_or_create_session(request)
        cache = session["deadlines_cache"]
        now = datetime.datetime.now()

        # Check if cache is fresh (within 30 mins)
        if not sync and cache["data"] is not None and cache["timestamp"] is not None:
            if (now - cache["timestamp"]).total_seconds() < 30 * 60:
                return {"deadlines": cache["data"], "cached": True}

        service = get_google_service(request)
        log_audit_action(request, "READ_CALENDAR", "Dashboard: Scanned Calendar events for deadlines", status="auto", details="Scanning primary calendar events for deadlines")
        events = service.list_calendar_events()
        
        # Build list of parsed deadlines
        # For mock mode, we immediately return structured academic deadlines to save token costs
        if service.is_mock:
            def relative_deadline_date(days_offset):
                target = now + datetime.timedelta(days=days_offset)
                return target.replace(hour=23, minute=59, second=0).isoformat()
            
            deadlines = [
                {
                    "id": "dl_1",
                    "title": "Computer Vision Lab Report 2",
                    "subject": "CS 461",
                    "due_date": relative_deadline_date(2),
                    "urgency": "critical",
                    "source": "calendar",
                    "source_id": "mock_event_1"
                },
                {
                    "id": "dl_2",
                    "title": "Networks Presentation Slides",
                    "subject": "CS 465",
                    "due_date": relative_deadline_date(1),
                    "urgency": "critical",
                    "source": "calendar",
                    "source_id": "mock_event_3"
                },
                {
                    "id": "dl_3",
                    "title": "KBS Midterm Examination",
                    "subject": "CS 463",
                    "due_date": relative_deadline_date(6),
                    "urgency": "upcoming",
                    "source": "calendar",
                    "source_id": "mock_exam_1"
                }
            ]
        else:
            # Real Mode: Map raw calendar fields and compute urgency purely in Python
            deadlines = []
            for event in events:
                summary = event.get("summary", "Untitled Deadline")
                start_date_str = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date")
                if not start_date_str:
                    continue
                
                # Compute urgency purely based on date difference
                urgency = "later"
                try:
                    if "T" in start_date_str:
                        dt = datetime.datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                        now_tz = datetime.datetime.now(dt.tzinfo)
                        diff = dt - now_tz
                    else:
                        dt = datetime.datetime.strptime(start_date_str, "%Y-%m-%d").date()
                        now_tz = datetime.datetime.now().date()
                        diff = dt - now_tz
                    
                    days_diff = diff.days if hasattr(diff, "days") else diff.total_seconds() / 86400
                    
                    if days_diff < 0:
                        urgency = "overdue"
                    elif days_diff <= 3:
                        urgency = "critical"
                    elif days_diff <= 7:
                        urgency = "upcoming"
                    else:
                        urgency = "later"
                except Exception as ex:
                    print(f"Error computing urgency for deadline: {ex}")
                
                # Extrapolate subject from summary using regex pattern
                match = re.search(r'\b[A-Za-z]{2,4}\s*\d{3}\b', summary)
                subject = match.group(0) if match else "Academic"
                
                deadlines.append({
                    "id": f"dl_{event.get('id')}",
                    "title": summary,
                    "subject": subject,
                    "due_date": start_date_str,
                    "urgency": urgency,
                    "source": "calendar",
                    "source_id": event.get("id")
                })

        # Update cache
        session["deadlines_cache"]["data"] = deadlines
        session["deadlines_cache"]["timestamp"] = now

        return {"deadlines": deadlines, "cached": False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-digest")
async def get_email_digest(request: Request, sync: bool = False):
    """
    Triages professor/academic emails and generates summaries and categories.
    Caches results in memory for 30 minutes unless sync is requested.
    """
    try:
        session = get_or_create_session(request)
        cache = session["email_digest_cache"]
        now = datetime.datetime.now()

        # Check if cache is fresh (within 30 mins)
        if not sync and cache["data"] is not None and cache["timestamp"] is not None:
            if (now - cache["timestamp"]).total_seconds() < 30 * 60:
                return {"digest": cache["data"], "cached": True}

        service = get_google_service(request)
        log_audit_action(request, "READ_GMAIL", "Dashboard: Retrieved and triaged academic unread emails", status="auto", details="Triage inbox messages from university/professor domains")
        msg_list = service.list_gmail_messages()
        
        emails = []
        for m in msg_list[:5]:
            msg = service.get_gmail_message(m["id"])
            emails.append(msg)

        # In mock mode, return static structured digest
        if service.is_mock:
            digest = [
                {
                    "id": "digest_1",
                    "category": "action_required",
                    "sender": "Dr. Khalid Ahmed",
                    "subject": "CS 461 — Lab Report Submission Deadline Extension",
                    "summary": "The Computer Vision lab report submission deadline is extended to Saturday, July 4th at 11:59 PM.",
                    "dates_mentioned": ["2026-07-04"],
                    "email_id": "mock_msg_1"
                },
                {
                    "id": "digest_2",
                    "category": "announcement",
                    "sender": "Academic Registrar",
                    "subject": "Midterm Examination Schedule Announcement",
                    "summary": "Midterm examinations will start on Monday, July 6th, 2026. The KBS exam is scheduled for July 8th.",
                    "dates_mentioned": ["2026-07-06", "2026-07-08"],
                    "email_id": "mock_msg_2"
                },
                {
                    "id": "digest_3",
                    "category": "fyi",
                    "sender": "Prof. Sara Khan",
                    "subject": "CS 465 — Group project updates",
                    "summary": "Students must coordinate project slide content by Friday, July 3rd.",
                    "dates_mentioned": ["2026-07-03"],
                    "email_id": "mock_msg_3"
                }
            ]
        else:
            # Real Mode: local Python triage and summary (first 200 chars, keyword classification)
            digest = []
            for email in emails:
                headers = email.get("payload", {}).get("headers", [])
                sender_full = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown")
                sender_name = sender_full.split("<")[0].strip() if "<" in sender_full else sender_full
                subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
                
                # Safe body extraction
                body_text = extract_email_body(email)
                
                # First 200 characters of email body as summary
                summary = body_text[:200]
                if len(body_text) > 200:
                    summary += "..."
                
                # Classify email category based on subject keywords
                lower_subject = subject.lower()
                if any(w in lower_subject for w in ["deadline", "submission", "urgent", "required", "due", "quiz", "exam", "viva"]):
                    category = "action_required"
                else:
                    category = "announcement"
                
                # Extract dates mentioned in YYYY-MM-DD format
                dates_mentioned = re.findall(r'\b\d{4}-\d{2}-\d{2}\b', body_text)
                
                digest.append({
                    "id": f"dig_{email.get('id')}",
                    "category": category,
                    "sender": sender_name,
                    "subject": subject,
                    "summary": summary,
                    "dates_mentioned": dates_mentioned,
                    "email_id": email.get("id")
                })

        # Update cache
        session["email_digest_cache"]["data"] = digest
        session["email_digest_cache"]["timestamp"] = now

        return {"digest": digest, "cached": False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StudyPlanRequest(BaseModel):
    exam_title: str
    exam_date: str
    course_code: str
    hours_per_day: int = 2

@router.post("/study-plan")
async def create_study_plan_endpoint(request: Request, body: StudyPlanRequest):
    """
    Generates a day-by-day study plan avoiding calendar conflicts and creates a pending action.
    """
    try:
        service = get_google_service(request)
        
        # 1. Fetch calendar events between now and the exam date
        events = service.list_calendar_events()
        
        # 2. Call Gemini to generate conflicts-free study blocks
        from app.services.gemini import GeminiService
        gemini = GeminiService()
        
        now_str = datetime.datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
        Design a day-by-day study plan for the exam: "{body.exam_title}" ({body.course_code}) scheduled on {body.exam_date}.
        The current date is {now_str}.
        The user wants to study {body.hours_per_day} hours per day.
        
        Existing Busy Calendar Events:
        {json.dumps(events) if 'events' in locals() else '[]'}
        
        Schedule study sessions only in the remaining free slots, preferably in the evening (between 4 PM and 9 PM).
        For each day from today until the day before the exam, generate a study block.
        Avoid conflicts with any busy times in the existing calendar events list.
        
        Conform EXACTLY to this JSON format:
        {{
            "events": [
                {{
                    "summary": "[AcademeIQ] Study Block - {body.course_code}",
                    "start_time": "ISO-8601-datetime-string",
                    "end_time": "ISO-8601-datetime-string",
                    "description": "Topics: Course review, problem solving"
                }}
            ]
        }}
        """
        
        from google.genai import types
        import json
        
        if gemini.is_mock:
            # Generate mock study plan events
            now = datetime.datetime.now()
            proposed_events = []
            for i in range(1, 4):
                day = now + datetime.timedelta(days=i)
                start_iso = day.replace(hour=17, minute=0, second=0).isoformat()
                end_iso = day.replace(hour=19, minute=0, second=0).isoformat()
                proposed_events.append({
                    "summary": f"[AcademeIQ] Study Block - {body.course_code}",
                    "start_time": start_iso,
                    "end_time": end_iso,
                    "description": f"Topics: Course review, exam preparation session {i}"
                })
        else:
            response = gemini.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            proposed_events = data.get("events", [])
        
        # 3. Create a pending action in the session
        import uuid
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        
        # Map proposed events to prompt schema: title, start, end
        mapped_events = []
        for ev in proposed_events:
            mapped_events.append({
                "title": ev.get("summary") or ev.get("title") or f"[AcademeIQ] Study Block - {body.course_code}",
                "start": ev.get("start_time") or ev.get("start") or "",
                "end": ev.get("end_time") or ev.get("end") or "",
                "description": ev.get("description", "")
            })
            
        session = get_or_create_session(request)
        session["pending_actions"][action_id] = {
            "action_type": "CREATE_CALENDAR_EVENTS",
            "description": f"Create study plan events for {body.course_code}",
            "args": {"events": mapped_events},
            "status": "pending"
        }
        
        return {
            "action_id": action_id,
            "action_type": "CREATE_CALENDAR_EVENTS",
            "description": f"Create study plan events for {body.course_code}",
            "preview": {"events": mapped_events}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExportBriefingRequest(BaseModel):
    briefing: dict

def format_briefing_markdown(briefing: dict) -> str:
    md = "# AcademeIQ Weekly Academic Briefing\n\n"
    md += f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    md += "## Upcoming Deadlines\n"
    deadlines = briefing.get("deadlines", [])
    if deadlines:
        for dl in deadlines:
            md += f"- **{dl.get('title')}** ({dl.get('subject', 'Academic')}) - Due: {dl.get('due_date')}\n"
    else:
        md += "_No upcoming deadlines._\n"
    md += "\n"
    
    md += "## Email Action Items\n"
    emails = briefing.get("email_actions", [])
    if emails:
        for em in emails:
            md += f"- **From:** {em.get('sender')} | **Subject:** {em.get('subject')}\n  _Summary:_ {em.get('summary')}\n"
    else:
        md += "_No urgent academic email actions._\n"
    md += "\n"
    
    md += "## Scheduled Study Sessions\n"
    sessions = briefing.get("study_sessions", [])
    if sessions:
        for s in sessions:
            md += f"- **{s.get('title')}** | Time: {s.get('start')} to {s.get('end')}\n"
    else:
        md += "_No scheduled study blocks._\n"
    md += "\n"
    
    md += "## Weekly Goals\n"
    goals = briefing.get("weekly_goals", [])
    if goals:
        for g in goals:
            md += f"- [ ] {g}\n"
    else:
        md += "_No goals defined._\n"
    md += "\n"
    
    md += "## Advisor Notes\n"
    md += briefing.get("notes", "No advisor notes.")
    md += "\n"
    return md

@router.get("/briefing")
async def get_weekly_briefing(request: Request):
    """
    Fetches Google Calendar, Gmail, and Google Drive files and synthesizes them into an academic briefing.
    """
    try:
        service = get_google_service(request)
        log_audit_action(request, "GENERATE_BRIEFING", "Synthesized weekly academic briefing report", status="auto", details="Compiled Gmail, Calendar, and Drive data via Gemini")
        
        if service.is_mock:
            # Return static mock data
            now = datetime.datetime.now()
            def relative_date(days_offset, hour=23, minute=59):
                target = now + datetime.timedelta(days=days_offset)
                return target.replace(hour=hour, minute=minute, second=0).isoformat()
                
            mock_briefing = {
                "deadlines": [
                    { "title": "Computer Vision Lab Report 2", "due_date": relative_date(2), "subject": "CS 461" },
                    { "title": "Networks Presentation Slides", "due_date": relative_date(1), "subject": "CS 465" },
                    { "title": "KBS Midterm Examination", "due_date": relative_date(6), "subject": "CS 463" }
                ],
                "email_actions": [
                    { "sender": "Dr. Khalid Ahmed", "subject": "CS 461 — Lab Report Submission Deadline Extension", "summary": "The Computer Vision lab report submission deadline is extended to Saturday, July 4th at 11:59 PM." },
                    { "sender": "Academic Registrar", "subject": "Midterm Examination Schedule Announcement", "summary": "Midterm examinations will start on Monday, July 6th, 2026. The KBS exam is scheduled for July 8th." }
                ],
                "study_sessions": [
                    { "title": "Study Block - CS 463", "start": relative_date(1, 17, 0), "end": relative_date(1, 19, 0) },
                    { "title": "Study Block - CS 461", "start": relative_date(2, 17, 0), "end": relative_date(2, 19, 0) }
                ],
                "weekly_goals": [
                    "Complete CV Lab Report 2 before the Saturday deadline",
                    "Finish drafting presentation slides for Networks and align with group teammates",
                    "Attempt KBS past papers 2024 and 2025"
                ],
                "notes": "Ensure you get started on the Networks project slides early, as the presentation is next Monday and has multiple dependencies. The KBS exam is scheduled for next Wednesday; plan at least 2 sessions for mock papers."
            }
            return {"briefing": mock_briefing}
            
        else:
            # Real mode - fetch and synthesize using Gemini
            # Fetch calendar events (next 7 days)
            try:
                events = service.list_calendar_events()
            except Exception:
                events = []
            
            # Fetch Gmail messages (last 7 days unread)
            emails = []
            try:
                gmail_list = service.list_gmail_messages(query="is:unread", max_results=10)
                for msg in gmail_list[:5]:
                    try:
                        full_msg = service.get_gmail_message(msg["id"])
                        headers = full_msg.get("payload", {}).get("headers", [])
                        subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
                        sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown")
                        snippet = full_msg.get("snippet", "")
                        emails.append({"id": msg["id"], "subject": subject, "sender": sender, "snippet": snippet})
                    except Exception:
                        pass
            except Exception:
                pass
                    
            # Fetch recent files (last 5 files)
            try:
                drive_files = service.list_drive_files(max_results=5)
            except Exception:
                drive_files = []
            
            # Synthesize via Gemini
            try:
                from app.services.gemini import GeminiService
                gemini = GeminiService()
                
                now_str = datetime.datetime.now().strftime("%Y-%m-%d")
                prompt = f"""
                You are AcademeIQ, a personal academic concierge. Synthesize a structured academic briefing for the user based on their Google account metadata for the next 7 days.
                Today is {now_str}.
                
                Calendar Events:
                {json.dumps(events)}
                
                Gmail Messages:
                {json.dumps(emails)}
                
                Google Drive Files:
                {json.dumps(drive_files)}
                
                Output a JSON object for the weekly briefing. Conforming EXACTLY to this JSON structure:
                {{
                    "deadlines": [
                        {{
                            "title": "Assignment/Exam Title",
                            "due_date": "ISO-8601-datetime-string",
                            "subject": "Course Name/Code"
                        }}
                    ],
                    "email_actions": [
                        {{
                            "sender": "Professor/Sender Name",
                            "subject": "Email Subject",
                            "summary": "Brief 1-sentence action-oriented summary of the email"
                        }}
                    ],
                    "study_sessions": [
                        {{
                            "title": "Study block title",
                            "start": "ISO-8601-datetime-string",
                            "end": "ISO-8601-datetime-string"
                        }}
                    ],
                    "weekly_goals": [
                        "Actionable goal 1...",
                        "Actionable goal 2..."
                    ],
                    "notes": "General advice or warnings about conflicts or constraints for the upcoming week"
                }}
                """
                
                from google.genai import types
                
                response = gemini.client.models.generate_content(
                    model="gemini-2.0-flash-lite",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                
                briefing_data = json.loads(response.text)
                return {"briefing": briefing_data}
            except Exception as e:
                print(f"Gemini weekly briefing synthesis failed: {e}")
                fallback_briefing = {
                    "deadlines": [],
                    "email_actions": [],
                    "study_sessions": [],
                    "weekly_goals": [],
                    "notes": "No upcoming items found."
                }
                return {"briefing": fallback_briefing}
            
    except Exception as e:
        print(f"General weekly briefing error: {e}")
        fallback_briefing = {
            "deadlines": [],
            "email_actions": [],
            "study_sessions": [],
            "weekly_goals": [],
            "notes": "No upcoming items found."
        }
        return {"briefing": fallback_briefing}

@router.post("/briefing/export")
async def export_weekly_briefing(request: Request, body: ExportBriefingRequest):
    """
    Generates a Markdown file representation of the briefing and queues a SAVE_TO_DRIVE pending action.
    """
    try:
        service = get_google_service(request)
        md_content = format_briefing_markdown(body.briefing)
        
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        filename = f"AcademeIQ_Weekly_Briefing_{date_str}.md"
        
        import uuid
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        
        # Store pending action in session
        session = get_or_create_session(request)
        session["pending_actions"][action_id] = {
            "action_type": "SAVE_TO_DRIVE",
            "description": f"Save Weekly Briefing to Google Drive as: {filename}",
            "args": {
                "filename": filename,
                "content": md_content,
                "mime_type": "text/markdown"
            },
            "status": "pending"
        }
        
        return {
            "action_id": action_id,
            "action_type": "SAVE_TO_DRIVE",
            "description": f"Save Weekly Briefing to Google Drive as: {filename}",
            "preview": {
                "filename": filename,
                "content": md_content,
                "mime_type": "text/markdown"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
