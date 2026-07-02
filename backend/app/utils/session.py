import uuid
import datetime
from fastapi import Request

# Global in-memory session store
SESSION_STORE = {}

def get_or_create_session(request: Request) -> dict:
    """
    Retrieves or initializes the in-memory session data for the user.
    """
    session_id = request.session.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())
        request.session["session_id"] = session_id

    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {
            "conversation_history": [],
            "audit_log": [],
            "pending_actions": {},
            "deadlines_cache": {"data": None, "timestamp": None},
            "email_digest_cache": {"data": None, "timestamp": None}
        }
    return SESSION_STORE[session_id]

def log_audit_action(request: Request, action_type: str, description: str, status: str = "auto", details: str = ""):
    """
    Appends a new event entry into the user's session audit log.
    """
    session = get_or_create_session(request)
    entry = {
        "id": f"aud_{len(session['audit_log']) + 1}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "action_type": action_type,
        "description": description,
        "status": status,  # "approved", "rejected", "auto"
        "category": "read" if "read" in action_type.lower() or "list" in action_type.lower() or "get" in action_type.lower() else "write",
        "details": details
    }
    session["audit_log"].append(entry)
