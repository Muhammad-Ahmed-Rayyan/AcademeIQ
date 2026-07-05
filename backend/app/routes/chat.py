import json
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.gemini import GeminiService
from app.services.google_api import GoogleApiService

router = APIRouter(prefix="/api", tags=["chat"])

from app.utils.session import get_or_create_session, log_audit_action

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: Request, body: ChatRequest):
    """
    Accepts a user message, calls Gemini, and streams the response via SSE.
    Also appends the interaction to the session's conversation history.
    """
    session = get_or_create_session(request)
    history = session["conversation_history"]
    user_message = body.message

    # Append user message to history immediately
    history.append({"sender": "user", "text": user_message})

    # Instantiate Gemini and Google API services
    gemini_service = GeminiService()
    
    user = request.session.get("user", {})
    google_token = request.session.get("google_token", {})
    is_mock = user.get("provider", "mock") == "mock" or not google_token.get("access_token")
    
    google_service = GoogleApiService(google_token=google_token, is_mock=is_mock)

    async def event_generator():
        full_response = ""
        try:
            async for chunk in gemini_service.generate_chat_stream(
                history=history[:-1], 
                new_message=user_message,
                google_service=google_service,
                request=request
            ):
                if chunk.startswith("__pending_action__:"):
                    try:
                        raw = chunk[len("__pending_action__:"):].strip()
                        raw = raw.replace("\n", "").replace("\r", "").strip()
                        action_data = json.loads(raw)
                        yield f"data: {json.dumps({'type': 'text', 'content': ''})}\n\n"
                        yield f"data: {json.dumps({'type': 'pending_action', **action_data})}\n\n"
                        print(f"[SECURITY] Pending action sent to frontend: {action_data['action_id']} ({action_data['action_type']})")
                    except Exception as ex:
                        print(f"Error parsing pending action packet: {ex} | raw={chunk[:200]}")
                else:
                    full_response += chunk
                    yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
            
            history.append({"sender": "agent", "text": full_response})
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Stream error: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/chat/clear")
async def clear_chat(request: Request):
    """
    Clears the conversation history from the user session.
    """
    session = get_or_create_session(request)
    session["conversation_history"] = []
    return {"status": "cleared", "message": "Conversation history cleared successfully"}

class ConfirmActionRequest(BaseModel):
    action_id: str
    decision: str
    modified_data: dict = None

@router.get("/actions/pending")
async def get_pending_actions(request: Request):
    """
    Returns any active pending actions in the session to restore state on UI refresh.
    """
    session = get_or_create_session(request)
    pending_actions = session.get("pending_actions", {})
    return {"pending_actions": [{"action_id": k, **v} for k, v in pending_actions.items()]}

@router.post("/actions/confirm")
async def confirm_action(request: Request, body: ConfirmActionRequest):
    """
    Executes or cancels a pending write action based on user decision.
    """
    session = get_or_create_session(request)
    pending_actions = session.get("pending_actions", {})
    
    if body.action_id not in pending_actions:
        raise HTTPException(status_code=404, detail="Pending action not found or expired.")
        
    action = pending_actions[body.action_id]
    if body.modified_data:
        action["args"].update(body.modified_data)
        
    action_type = action["action_type"]
    args = action["args"]
    
    if body.decision == "rejected":
        # User rejected the action
        log_audit_action(
            request, 
            action_type, 
            f"Cancelled execution of pending action: {action_type}", 
            status="rejected", 
            details=f"Parameters: {args}"
        )
        del pending_actions[body.action_id]
        return {"status": "rejected", "message": "Action execution cancelled by user."}
        
    # User approved - execute action
    try:
        user = request.session.get("user", {})
        google_token = request.session.get("google_token", {})
        is_mock = user.get("provider", "mock") == "mock" or not google_token.get("access_token")
        
        google_service = GoogleApiService(google_token=google_token, is_mock=is_mock)
        
        result = {}
        if action_type == "CREATE_CALENDAR_EVENTS":
            events = args.get("events", [])
            created_results = []
            for ev in events:
                title = ev.get("title") or ev.get("summary") or "Untitled Event"
                start = ev.get("start") or ev.get("start_time") or ""
                end = ev.get("end") or ev.get("end_time") or ""
                desc = ev.get("description", "")
                
                res = google_service.create_calendar_event(
                    summary=title,
                    start_time=start,
                    end_time=end,
                    description=desc
                )
                created_results.append(res)
            result = {"created_count": len(created_results), "events": created_results}
        elif action_type == "SEND_EMAIL":
            result = google_service.send_gmail_message(
                to=args.get("to"),
                subject=args.get("subject"),
                body=args.get("body")
            )
        elif action_type == "CREATE_DRAFT":
            result = google_service.create_gmail_draft(
                to=args.get("to"),
                subject=args.get("subject"),
                body=args.get("body")
            )
        elif action_type == "SAVE_TO_DRIVE":
            result = google_service.create_drive_file(
                filename=args.get("filename"),
                content=args.get("content"),
                mime_type=args.get("mime_type", "text/plain")
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported action type: {action_type}")
            
        # Log audit entry as approved (success)
        log_audit_action(
            request, 
            action_type, 
            f"Executed action: {action_type}", 
            status="approved", 
            details=f"Parameters: {args} | Result: {result}"
        )
        
        # Clear the caches so dashboard picks up newly created items!
        session["deadlines_cache"] = {"data": None, "timestamp": None}
        session["email_digest_cache"] = {"data": None, "timestamp": None}
        
        del pending_actions[body.action_id]
        return {"status": "success", "message": "Action executed successfully.", "result": result}
        
    except Exception as e:
        # Log audit entry as failed
        log_audit_action(
            request, 
            action_type, 
            f"Failed execution of pending action: {action_type}", 
            status="rejected", 
            details=f"Parameters: {args} | Error: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=f"Action execution failed: {str(e)}")
