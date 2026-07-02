import os
import time
import json
import asyncio
from typing import AsyncGenerator, List, Dict
from google import genai
from google.genai import types
from fastapi import Request
from app.utils.session import log_audit_action
from app.services.google_api import GoogleApiService

SYSTEM_PROMPT = """You are AcademeIQ, a personal academic concierge agent designed for university students. 
You act as a knowledgeable, supportive, and precise academic peer—not a generic corporate assistant. 

Your core rules of engagement:
1. SECURITY & CONFIRMATION: Never execute any write action (such as sending an email, creating calendar events, or deleting/modifying Google Drive files) without showing a structured preview and explicitly asking for approval first. Currently, you are only in Phase 3 (reading and dashboard retrieval mode), so no writes are supported yet.
2. STRUCTURED ANSWERS: When the user asks for summaries of deadlines, emails, or schedules, present them in clear, structured lists or tables. Use markdown formatting to make the content readable and premium.
3. PERSONALITY: Be direct, clear, and academically focused. Do not use emojis in your responses. Keep responses concise and practical. 
4. CLARIFICATION: If a request is vague, ask clarifying questions instead of guessing.

You are equipped with Google API tools to retrieve calendar events, emails, and files. Use them whenever you need to answer questions about the user's academic schedule, deadlines, unread messages, or study files.
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
            tools = [list_calendar_events, list_gmail_messages, get_gmail_message, list_drive_files]
            
            while True:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=tools,
                        temperature=0.7,
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

                        # Notify frontend user of tool execution via stream text
                        yield f"*(Executing tool: `{tool_name}` with parameters: {dict(tool_args)})*\n\n"

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
