import logging
import uuid
import requests as sync_requests
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from core.database import db
from core.config import ADMIN_EMAIL, SESSION_EXPIRY_DAYS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

@router.post("/auth/session")
async def exchange_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        resp = sync_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"Auth session exchange failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]
    role = "admin" if email == ADMIN_EMAIL else "member"

    blocked = await db.blocked_emails.find_one({"email": email})
    if blocked:
        raise HTTPException(status_code=403, detail="Your account has been blocked. Contact the admin.")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
        user_id = existing["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "professional_experience": "",
            "current_role": "",
            "aspirations": "",
            "linkedin_url": "",
            "skills": [],
            "residing_in": "",
            "onboarding_complete": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    response = JSONResponse(content={"user": user, "session_token": session_token})
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=SESSION_EXPIRY_DAYS * 86400
    )
    return response

@router.get("/auth/me")
async def auth_me(request: Request):
    from core.auth import get_current_user
    user = await get_current_user(request)
    return user

@router.post("/auth/logout")
async def logout(request: Request):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return response
