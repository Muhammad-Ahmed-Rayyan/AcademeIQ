import json
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.gemini import GeminiService

router = APIRouter(prefix="/api", tags=["chat"])

# In-memory session store (dictionary) to store large session variables (like history & audit logs)
# This prevents hitting cookie size limits (4KB) and allows updates within SSE streams.
SESSION_STORE = {}

class ChatRequest(BaseModel):
    message: str

def get_or_create_session(request: Request) -> dict:
    """
    Retrieves or initializes the in-memory session data for the user.
    """
    # Ensure there is a session ID in the Starlette session cookie
    session_id = request.session.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
        request.session["session_id"] = session_id

    # Initialize data structure if not already present
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {
            "conversation_history": [],
            "audit_log": [],
            "pending_actions": {}
        }
    return SESSION_STORE[session_id]

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

    # Instantiate Gemini service
    gemini_service = GeminiService()

    async def event_generator():
        full_response = ""
        try:
            # Stream response chunks from Gemini service
            async for chunk in gemini_service.generate_chat_stream(history[:-1], user_message):
                full_response += chunk
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
            
            # Append complete assistant response to history
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
