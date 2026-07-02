import os
import urllib.parse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

router = APIRouter(prefix="/auth", tags=["auth"])

# Check if Google Credentials are set and valid (not empty/placeholders)
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# We determine we are in mock mode if client ID/secret are not configured or contain placeholder values
is_mock_mode = (
    not CLIENT_ID 
    or not CLIENT_SECRET 
    or "your_google" in CLIENT_ID 
    or "your_google" in CLIENT_SECRET
)

# Setup Authlib OAuth client if we have credentials
oauth = OAuth()
if not is_mock_mode:
    # Set up config dict for Authlib
    config_dict = {
        "GOOGLE_CLIENT_ID": CLIENT_ID,
        "GOOGLE_CLIENT_SECRET": CLIENT_SECRET,
    }
    config = Config(environ=config_dict)
    oauth.register(
        name="google",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive"
        }
    )

@router.get("/login")
async def login(request: Request):
    """
    Initiates Google OAuth or redirects to mock auth if credentials are not configured.
    """
    if is_mock_mode:
        # Redirect directly to callback with a mock indicator
        callback_url = f"/auth/callback?mock=true"
        return RedirectResponse(url=callback_url)
    
    # Real Google OAuth flow
    # Generate redirect URI
    redirect_uri = REDIRECT_URI
    return await oauth.google.authorize_redirect(
        request, 
        redirect_uri, 
        access_type="offline", 
        prompt="consent"
    )

@router.get("/callback")
async def callback(request: Request, mock: bool = False, code: str = None):
    """
    Handles redirect callback from Google OAuth or sets up mock session.
    """
    if is_mock_mode or mock:
        # Setup a mock user session for testing
        request.session["user"] = {
            "name": "Alex Dev",
            "email": "alex.dev@university.edu",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
            "provider": "mock"
        }
        # In mock mode, we also mock Google tokens so they are present in session
        request.session["google_token"] = {
            "access_token": "mock_access_token_xyz_123",
            "refresh_token": "mock_refresh_token_xyz_123",
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": CLIENT_ID or "mock_client_id",
            "client_secret": CLIENT_SECRET or "mock_client_secret",
            "scopes": [
                "openid", "email", "profile", 
                "https://www.googleapis.com/auth/calendar", 
                "https://www.googleapis.com/auth/gmail.modify", 
                "https://www.googleapis.com/auth/drive"
            ],
            "expires_at": 9999999999
        }
        # Redirect to dashboard
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
    
    # Real Google OAuth Callback
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            # Fallback to fetching manually if not in ID token
            resp = await oauth.google.get("https://www.googleapis.com/oauth2/v3/userinfo", token=token)
            user_info = resp.json()
        
        # Save user info & token in session
        request.session["user"] = {
            "name": user_info.get("name"),
            "email": user_info.get("email"),
            "avatar": user_info.get("picture"),
            "provider": "google"
        }
        request.session["google_token"] = {
            "access_token": token.get("access_token"),
            "refresh_token": token.get("refresh_token"),
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scopes": token.get("scope", "").split(" ") if token.get("scope") else [
                "openid", "email", "profile", 
                "https://www.googleapis.com/auth/calendar", 
                "https://www.googleapis.com/auth/gmail.modify", 
                "https://www.googleapis.com/auth/drive"
            ],
            "expires_at": token.get("expires_at")
        }
        
        # Initialize an empty audit log and conversation history for the session if not present
        if "audit_log" not in request.session:
            request.session["audit_log"] = []
        if "conversation_history" not in request.session:
            request.session["conversation_history"] = []
        if "pending_actions" not in request.session:
            request.session["pending_actions"] = {}

        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@router.get("/logout")
async def logout(request: Request):
    """
    Clears user session and redirects to login or returns logged out status.
    """
    request.session.clear()
    return JSONResponse(
        content={"status": "logged_out", "message": "Successfully logged out"},
        status_code=200
    )

@router.get("/me")
async def me(request: Request):
    """
    Returns user profile if authenticated.
    """
    user = request.session.get("user")
    if user:
        return {
            "authenticated": True,
            "user": user,
            "mode": "mock" if is_mock_mode else "real"
        }
    return {
        "authenticated": False,
        "user": None,
        "mode": "mock" if is_mock_mode else "real"
    }
