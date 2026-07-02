import datetime
import re
from fastapi import APIRouter, Request, HTTPException
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
    Fetches today's schedule events from Calendar.
    """
    try:
        service = get_google_service(request)
        log_audit_action(request, "READ_CALENDAR", "Dashboard: Retrieved today's class schedule", status="auto", details="Loaded Today's Schedule panel data")
        events = service.list_calendar_events()
        
        # Filter events happening today (in user's timezone or simple filter for mock)
        now = datetime.datetime.now()
        today_events = []
        for event in events:
            start_dateTime = event.get("start", {}).get("dateTime", "")
            if not start_dateTime:
                continue
            
            # Simple check if event starts today (e.g. comparing YYYY-MM-DD prefix)
            event_date = start_dateTime.split("T")[0]
            today_date = now.strftime("%Y-%m-%d")
            
            # If mock, we return a few mock events relative to today anyway
            if service.is_mock or event_date == today_date:
                today_events.append({
                    "id": event.get("id"),
                    "title": event.get("summary", "Untitled Session"),
                    "description": event.get("description", ""),
                    "start_time": start_dateTime,
                    "end_time": event.get("end", {}).get("dateTime", ""),
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
