import os
import time
import json
import asyncio
import datetime
from typing import AsyncGenerator, List, Dict
from google import genai
from google.genai import types
from fastapi import Request
from app.utils.session import log_audit_action, get_or_create_session
from app.services.google_api import GoogleApiService
import uuid

SYSTEM_PROMPT = """You are AcademeIQ, a personal academic concierge agent designed for university students.
You act as a knowledgeable, supportive, and precise academic peer—not a generic corporate assistant.

CRITICAL TOOL USAGE RULES - YOU MUST FOLLOW THESE EXACTLY:
1. When the user asks to create a study plan, schedule study sessions, or block study time — you MUST call the `create_study_plan` tool. Do NOT describe what you would do. Do NOT say "I will create". CALL THE TOOL IMMEDIATELY after collecting exam_title, exam_date, and course_code.
2. When the user asks to send an email or draft an email — you MUST call `send_gmail_message` or `create_gmail_draft` tool. Do NOT write the email in chat text. CALL THE TOOL.
3. When the user asks to block time, create an event, or schedule something — you MUST call `create_calendar_event` tool. CALL THE TOOL.
4. Never describe an action in text when you have a tool for it. Always prefer calling the tool over explaining what you would do.
5. After calling a write tool, the system intercepts it automatically and shows the user an approval dialog. Tell the user "I have prepared the action for your review." Do NOT say "click approve in the preview dialog" — the system handles this.

Your core rules:
1. SECURITY: The system automatically intercepts all write tool calls and requires user approval before execution. You do not need to ask the user to approve manually.
2. STRUCTURED ANSWERS: Present deadlines, emails, schedules in clear markdown lists or tables.
3. PERSONALITY: Direct, clear, academically focused. No emojis. Concise and practical.
4. CLARIFICATION: If exam_date or course_code is missing for a study plan request, ask for it. Once you have it, immediately call the tool.

You have these tools available:
- list_calendar_events: Read calendar events
- list_gmail_messages: Search Gmail
- get_gmail_message: Read a specific email
- list_drive_files: Search Drive files
- create_study_plan: CREATE STUDY PLAN (call this for any study plan request)
- create_calendar_event: Create a single calendar event
- send_gmail_message: Send an email
- create_gmail_draft: Save email as draft
- create_drive_file: Save file to Drive
"""

# Define Python functions representing the tools for Gemini's function calling schema
def list_calendar_events(time_min: str = None, time_max: str = None) -> list:
    """
    Retrieves the list of upcoming events from the user's primary Google Calendar.
    """
    pass

def list_gmail_messages(query: str = "", max_results: int = 5) -> list:
    """
    Lists message headers and thread IDs from the user's Gmail matching a search query.
    """
    pass

def get_gmail_message(message_id: str) -> dict:
    """
    Retrieves the detailed subject, headers, and body content of a specific Gmail message.
    """
    pass

def list_drive_files(query: str = "", max_results: int = 5) -> list:
    """
    Searches and lists file names, mimeTypes, and modifications from the user's Google Drive.
    """
    pass

def create_calendar_event(summary: str, start_time: str, end_time: str, description: str = "") -> dict:
    """
    Creates a new calendar event in Google Calendar. Parameters summary, start_time (ISO-8601 string), and end_time (ISO-8601 string) are required.
    """
    pass

def send_gmail_message(to: str, subject: str, body: str) -> dict:
    """
    Sends an email to the specified recipient. Parameters to, subject, and body are required.
    """
    pass

def create_gmail_draft(to: str, subject: str, body: str) -> dict:
    """
    Creates a draft email in Gmail. Parameters to, subject, and body are required.
    """
    pass

def create_drive_file(filename: str, content: str, mime_type: str = "text/plain") -> dict:
    """
    Creates a new text or study file in Google Drive. Parameters filename and content are required.
    """
    pass

def create_study_plan(exam_title: str, exam_date: str, course_code: str, hours_per_day: int = 2) -> dict:
    """
    Creates a day-by-day study plan leading up to an exam, checking calendar conflicts and scheduling study blocks.
    Parameters exam_title, exam_date (YYYY-MM-DD), and course_code are required.
    """
    pass

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.is_mock = not self.api_key or "your_gemini" in self.api_key.lower()
        self.client = None

        if not self.is_mock:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Error initializing Gemini client: {e}. Falling back to mock mode.")
                self.is_mock = True

    async def generate_chat_stream(
        self, 
        history: List[Dict[str, str]], 
        new_message: str,
        google_service: GoogleApiService = None,
        request: Request = None
    ) -> AsyncGenerator[str, None]:
        """
        Generates a streaming chat response. Integrates multi-turn function calling for Google APIs if live.
        """
        if self.is_mock or not google_service:
            # Yield simulated response chunks
            mock_responses = {
                "hello": "Hello! I am AcademeIQ. How can I help you manage your courses or calendar today?",
                "deadline": "Searching your calendar and emails using Google API tools...\n\n*(Executing tools: list_calendar_events, list_gmail_messages)*\n\nI found these upcoming deadlines:\n- **Computer Vision Lab Report 2**: Due on July 4, 2026 (Critical - 2 days remaining)\n- **KBS Midterm Exam**: Due on July 8, 2026\n\nWould you like me to schedule a study plan block for these?",
                "study plan": "Sure! Let's build a study plan for your upcoming exams. I can allocate 2 hours every evening, avoiding your existing classes. Should I proceed and draft a proposal for Google Calendar?",
                "email": "I can help you draft an email to your professor. For example:\n\n**Subject:** [CS 461] Extension Request - Lab Report 2\n\n**Body:**\nDear Dr. Ahmed,\nI hope you are doing well. I am writing to request a brief 2-day extension on Lab Report 2 due to a project deadline conflict. Thank you for your consideration.\n\nSincerely,\n[Your Name]\n\nWould you like me to save this as a draft in your Gmail?",
                "file": "Searching your Google Drive files...\n\n*(Executing tool: list_drive_files)*\n\nI found these recent academic files in your Drive:\n- `CV_Assignment2_Brief.pdf` (modified yesterday)\n- `Networks_Lecture_Notes_7.pdf` (modified 2 days ago)\n- `KBS_Past_Paper_2025.pdf` (modified 3 days ago)"
            }

            lower_msg = new_message.lower()
            response_text = mock_responses["hello"]
            
            # Log Mock Audit Actions
            if request:
                if "deadline" in lower_msg:
                    log_audit_action(request, "READ_CALENDAR", "Retrieved upcoming classes and study blocks from Google Calendar (Mock)", status="auto", details="Requested mock calendar events")
                    log_audit_action(request, "READ_GMAIL", "Listed user emails with query: assignments/exams (Mock)", status="auto", details="Requested mock emails")
                elif "file" in lower_msg:
                    log_audit_action(request, "READ_DRIVE", "Searched and listed user files on Google Drive (Mock)", status="auto", details="Requested mock files")

            for key, val in mock_responses.items():
                if key in lower_msg:
                    response_text = val
                    break

            words = response_text.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.04)
            return

        # Real Gemini API Multi-turn Tool Calling Flow
        try:
            # Format history for Gemini SDK
            contents = []
            for h in history:
                role = "user" if h.get("sender") == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=h.get("text", ""))]
                    )
                )
            
            # Add new user message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=new_message)]
                )
            )

            # Keep track of active stream loop
            tools = [
                list_calendar_events, list_gmail_messages, get_gmail_message, list_drive_files,
                create_calendar_event, send_gmail_message, create_gmail_draft, create_drive_file,
                create_study_plan
            ]
            
            while True:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=tools,
                        temperature=0.1,
                        tool_config=types.ToolConfig(
                            function_calling_config=types.FunctionCallingConfig(
                                mode="AUTO"
                            )
                        )
                    )
                )

                # Check if the model requested a tool execution
                if response.function_calls:
                    # Append model's response (tool call requests) to contents to maintain turn history
                    contents.append(response.candidates[0].content)

                    # Build tool response parts
                    tool_parts = []
                    for call in response.function_calls:
                        tool_name = call.name
                        tool_args = call.args

                        # Intercept write tools — do NOT emit a text chunk for these;
                        # they will be sent as a pending_action SSE event instead.
                        write_tools = ["create_calendar_event", "send_gmail_message", "create_gmail_draft", "create_drive_file", "create_study_plan"]
                        if tool_name in write_tools:
                            action_id = f"act_{uuid.uuid4().hex[:8]}"
                            
                            mapped_action_type = ""
                            description = ""
                            args_payload = {}
                            preview_payload = {}
                            
                            if tool_name == "create_calendar_event":
                                mapped_action_type = "CREATE_CALENDAR_EVENTS"
                                summary = tool_args.get("summary") or "Untitled Event"
                                start_time = tool_args.get("start_time") or ""
                                end_time = tool_args.get("end_time") or ""
                                desc = tool_args.get("description", "")
                                
                                description = f"Create calendar event: {summary}"
                                args_payload = {"events": [{"title": summary, "start": start_time, "end": end_time, "description": desc}]}
                                preview_payload = {"events": [{"title": summary, "start": start_time, "end": end_time, "description": desc}]}
                                
                            elif tool_name == "create_study_plan":
                                mapped_action_type = "CREATE_CALENDAR_EVENTS"
                                proposed_events = await self._generate_study_plan_events(
                                    exam_title=tool_args.get("exam_title"),
                                    exam_date=tool_args.get("exam_date"),
                                    course_code=tool_args.get("course_code"),
                                    hours_per_day=tool_args.get("hours_per_day", 2),
                                    google_service=google_service
                                )
                                mapped_evs = []
                                for ev in proposed_events:
                                    mapped_evs.append({
                                        "title": ev.get("summary") or ev.get("title") or "Study Session",
                                        "start": ev.get("start_time") or ev.get("start") or "",
                                        "end": ev.get("end_time") or ev.get("end") or "",
                                        "description": ev.get("description", "")
                                    })
                                description = f"Create study plan events for {tool_args.get('course_code')}"
                                args_payload = {"events": mapped_evs}
                                preview_payload = {"events": mapped_evs}
                                
                            elif tool_name == "send_gmail_message":
                                mapped_action_type = "SEND_EMAIL"
                                description = f"Send extension request email to {tool_args.get('to')}"
                                args_payload = {"to": tool_args.get("to"), "subject": tool_args.get("subject"), "body": tool_args.get("body")}
                                preview_payload = {"to": tool_args.get("to"), "subject": tool_args.get("subject"), "body": tool_args.get("body")}
                                
                            elif tool_name == "create_gmail_draft":
                                mapped_action_type = "CREATE_DRAFT"
                                description = f"Create draft email to {tool_args.get('to')}"
                                args_payload = {"to": tool_args.get("to"), "subject": tool_args.get("subject"), "body": tool_args.get("body")}
                                preview_payload = {"to": tool_args.get("to"), "subject": tool_args.get("subject"), "body": tool_args.get("body")}
                                
                            elif tool_name == "create_drive_file":
                                mapped_action_type = "SAVE_TO_DRIVE"
                                description = f"Save file {tool_args.get('filename')} to Google Drive"
                                args_payload = {"filename": tool_args.get("filename"), "content": tool_args.get("content"), "mime_type": tool_args.get("mime_type", "text/plain")}
                                preview_payload = {"filename": tool_args.get("filename"), "content": tool_args.get("content"), "mime_type": tool_args.get("mime_type", "text/plain")}

                            # Store pending action in session
                            if request:
                                session = get_or_create_session(request)
                                session["pending_actions"][action_id] = {
                                    "action_type": mapped_action_type,
                                    "description": description,
                                    "args": args_payload,
                                    "status": "pending"
                                }
                            
                            # Send signal to client — MUST have \n\n so SSE frame is complete
                            yield f"__pending_action__:{json.dumps({'action_id': action_id, 'action_type': mapped_action_type, 'description': description, 'preview': preview_payload})}"
                            
                            # Return pending response to Gemini
                            tool_parts.append(
                                types.Part.from_function_response(
                                    name=tool_name,
                                    response={"status": "pending_approval", "message": f"Action ID {action_id} created and awaiting user approval. Tell the user to approve."}
                                )
                            )
                        else:
                            # Execute local tool passing request context
                            result = self._execute_tool(tool_name, tool_args, google_service, request)

                            # Create function response object
                            tool_parts.append(
                                types.Part.from_function_response(
                                    name=tool_name,
                                    response={"result": result}
                                )
                            )
                    
                    # Append tool responses to content history and loop back to model
                    contents.append(types.Content(role="tool", parts=tool_parts))
                    continue
                else:
                    # Standard text generated by Gemini (final response)
                    text_out = response.text
                    # Yield words slowly to mimic streaming
                    if text_out:
                        words = text_out.split(" ")
                        for i, w in enumerate(words):
                            yield w + (" " if i < len(words) - 1 else "")
                            await asyncio.sleep(0.02)
                    break

        except Exception as e:
            yield f"\n\n[Error calling Gemini API: {str(e)}]\n\n"

    async def _generate_study_plan_events(self, exam_title: str, exam_date: str, course_code: str, hours_per_day: int, google_service: GoogleApiService) -> list:
        """
        Generates proposed calendar study blocks avoiding conflicts.
        """
        events = google_service.list_calendar_events()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
        Design a day-by-day study plan for the exam: "{exam_title}" ({course_code}) scheduled on {exam_date}.
        The current date is {now_str}.
        The user wants to study {hours_per_day} hours per day.
        
        Existing Busy Calendar Events:
        {json.dumps(events)}
        
        Schedule study sessions only in the remaining free slots, preferably in the evening (between 4 PM and 9 PM).
        For each day from today until the day before the exam, generate a study block.
        Avoid conflicts with any busy times in the existing calendar events list.
        
        Conform EXACTLY to this JSON format:
        {{
            "events": [
                {{
                    "summary": "[AcademeIQ] Study Block - {course_code}",
                    "start_time": "ISO-8601-datetime-string",
                    "end_time": "ISO-8601-datetime-string",
                    "description": "Topics: Course review, problem solving"
                }}
            ]
        }}
        """
        if self.is_mock:
            now = datetime.datetime.now()
            proposed_events = []
            for i in range(1, 4):
                day = now + datetime.timedelta(days=i)
                start_iso = day.replace(hour=17, minute=0, second=0).isoformat()
                end_iso = day.replace(hour=19, minute=0, second=0).isoformat()
                proposed_events.append({
                    "summary": f"[AcademeIQ] Study Block - {course_code}",
                    "start_time": start_iso,
                    "end_time": end_iso,
                    "description": f"Topics: Course review, exam preparation session {i}"
                })
            return proposed_events
        else:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
            try:
                data = json.loads(response.text)
                return data.get("events", [])
            except Exception:
                return []

    def _execute_tool(self, name: str, args: dict, google_service: GoogleApiService, request: Request = None) -> dict:
        """
        Routing helper to invoke local Google API methods requested by Gemini.
        """
        try:
            if name == "list_calendar_events":
                if request:
                    log_audit_action(request, "READ_CALENDAR", "Retrieved calendar classes and study blocks", status="auto", details=f"Params: {args}")
                return google_service.list_calendar_events(
                    time_min=args.get("time_min"),
                    time_max=args.get("time_max")
                )
            elif name == "list_gmail_messages":
                if request:
                    log_audit_action(request, "READ_GMAIL", f"Listed user emails with query: {args.get('query', '')}", status="auto", details=f"Params: {args}")
                return google_service.list_gmail_messages(
                    query=args.get("query", ""),
                    max_results=args.get("max_results", 5)
                )
            elif name == "get_gmail_message":
                if request:
                    log_audit_action(request, "READ_GMAIL_CONTENT", f"Retrieved detailed email content for message ID: {args.get('message_id')}", status="auto", details=f"Params: {args}")
                msg = google_service.get_gmail_message(message_id=args.get("message_id"))
                # Return simplified email details to fit within context window
                headers = msg.get("payload", {}).get("headers", [])
                sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown")
                subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
                body = msg.get("payload", {}).get("body", {}).get("data", "")
                return {"sender": sender, "subject": subject, "body": body}
            elif name == "list_drive_files":
                if request:
                    log_audit_action(request, "READ_DRIVE", f"Searched and listed user files on Google Drive", status="auto", details=f"Params: {args}")
                return google_service.list_drive_files(
                    query=args.get("query", ""),
                    max_results=args.get("max_results", 5)
                )
            elif name == "create_calendar_event":
                return google_service.create_calendar_event(
                    summary=args.get("summary"),
                    start_time=args.get("start_time"),
                    end_time=args.get("end_time"),
                    description=args.get("description", "")
                )
            elif name == "send_gmail_message":
                return google_service.send_gmail_message(
                    to=args.get("to"),
                    subject=args.get("subject"),
                    body=args.get("body")
                )
            elif name == "create_gmail_draft":
                return google_service.create_gmail_draft(
                    to=args.get("to"),
                    subject=args.get("subject"),
                    body=args.get("body")
                )
            elif name == "create_drive_file":
                return google_service.create_drive_file(
                    filename=args.get("filename"),
                    content=args.get("content"),
                    mime_type=args.get("mime_type", "text/plain")
                )
            return {"error": f"Tool '{name}' not found."}
        except Exception as e:
            return {"error": str(e)}

    # --- DASHBOARD EXTRACTIONS ---
    async def extract_deadlines_from_api(self, events: list, emails: list) -> list:
        """
        Uses Gemini to parse calendar events and academic emails to output structured deadlines.
        """
        prompt = f"""
        Extract all university homework/assignment deadlines, project submissions, and midterm/final exam dates from this student metadata.
        
        Calendar Events:
        {json.dumps(events)}
        
        Gmail Messages:
        {json.dumps(emails)}

        Output a JSON array of deadlines. Conforming EXACTLY to this JSON structure:
        {{
            "deadlines": [
                {{
                    "id": "dl_unique_id",
                    "title": "Assignment/Exam Title",
                    "subject": "Course Name/Code",
                    "due_date": "ISO-8601-datetime-string",
                    "urgency": "critical" or "upcoming" or "later",
                    "source": "calendar" or "gmail",
                    "source_id": "original_event_or_message_id"
                }}
            ]
        }}
        Set urgency to 'critical' if due in 3 days or less, 'upcoming' if due in 7 days or less, and 'later' otherwise.
        """
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            return data.get("deadlines", [])
        except Exception as e:
            print(f"Gemini deadline extraction failed: {e}")
            return []

    async def summarize_emails_from_api(self, emails: list) -> list:
        """
        Uses Gemini to categorize and summarize academic emails.
        """
        prompt = f"""
        Triage and summarize the following university/professor emails.
        
        Emails:
        {json.dumps(emails)}

        For each email, generate a clean summary under 20 words, extract any dates mentioned, and classify its category as:
        - "action_required": Urgent task, exam date, or deadline change.
        - "announcement": General course announcements.
        - "fyi": Catch-up information or resources.

        Return a JSON response matching this schema:
        {{
            "digest": [
                {{
                    "id": "unique_digest_id",
                    "category": "action_required" or "announcement" or "fyi",
                    "sender": "Professor Name",
                    "subject": "Original Email Subject",
                    "summary": "Brief 15-20 word summary of email contents",
                    "dates_mentioned": ["YYYY-MM-DD"],
                    "email_id": "original_gmail_message_id"
                }}
            ]
        }}
        """
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            return data.get("digest", [])
        except Exception as e:
            print(f"Gemini email summarization failed: {e}")
            return []
