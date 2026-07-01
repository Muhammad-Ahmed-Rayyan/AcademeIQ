import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Setup FastAPI App
app = FastAPI(title="AcademeIQ Backend API", version="1.0.0")

# Secret key for session signing
SECRET_KEY = os.getenv("SECRET_KEY", "academeiq_fallback_secret_key_1234567890")

# Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="academeiq_session",
    max_age=3600 * 24,  # 24 hours
    same_site="lax",
    https_only=False,  # Set to True in production
)

# CORS Middleware
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes
from app.routes import auth, chat

app.include_router(auth.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AcademeIQ API. Auth and Page Shells ready."}
