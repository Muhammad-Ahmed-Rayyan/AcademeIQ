from fastapi import APIRouter, Request
from app.utils.session import get_or_create_session

router = APIRouter(prefix="/api", tags=["audit"])

@router.get("/audit")
async def get_audit_log(request: Request):
    """
    Returns the chronological list of audit entries recorded for the current user session.
    """
    session = get_or_create_session(request)
    # Return reverse chronological order so newest shows first on UI
    reversed_entries = list(reversed(session["audit_log"]))
    return {"entries": reversed_entries}
