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
            # Stream response chunks from Gemini service passing Google API context
            async for chunk in gemini_service.generate_chat_stream(
                history=history[:-1], 
                new_message=user_message,
                google_service=google_service,
                request=request
            ):
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
