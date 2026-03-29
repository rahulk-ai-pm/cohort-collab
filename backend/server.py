from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Header, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as sync_requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Config
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "iimk-apm06"
SESSION_EXPIRY_DAYS = 7

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Object Storage ───
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = sync_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = sync_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = sync_requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ─── Auth Helpers ───
async def get_current_user(request: Request) -> dict:
    token = None
    cookie_token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization")
    if cookie_token:
        token = cookie_token
    elif auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ─── Program Base Context for Chatbot ───
PROGRAM_CONTEXT = """
IIM Kozhikode - Professional Certificate Programme in Advanced Product Management (Batch 06)
Duration: 6 months (March 2026 - September 2026), Online, Sundays 9:00 AM - 12:00 PM
Programme Coordinator: Prof. Atanu Adhikari

CURRICULUM (20 Modules):
Module 01: Introduction - Value Creation, Communication, and Delivery
Module 02: Product and its Value Proposition - Choosing the Right Target Market
Module 03: Strategic Elements in Product Management and Product Roadmap
Module 04: Market Segmentation, Target Market Selection, and Buyer's Persona
Module 05: Managing Product Positioning
Module 06: Innovation in Product Management and Disruptive Innovation
Module 07-08: Simulation - Crossing the Chasm
Module 09: New Product Development Process
Module 10-11: Analytics For Product Managers Part 1 - Qualitative/Quantitative Analytics
Module 12: Analytics Part 2 - Conjoint Analysis, Market Share Estimation
Module 13: Product, Market Orientation, and Competitor Orientation
Module 14: Product Management at the Bottom of the Pyramid
Module 15: Agile Product Management, MVP, and MDP
Module 16: Managing Products in Business Market
Module 17: Analytics Part 3 - Market Segmentation, Segment Size, Profiling
Module 18-20: Comprehensive Simulation on Product Management

CASE STUDIES: Indraprastha Cold Storage, Linc to Luxury, Novartis: Beyond the Blockbuster,
Turtle's Transformation, Wow Momo: From Local to Global, Burger King The Moldy Whopper

PROJECTS: Capstone Project (real-world product strategy analysis) and Real-life Project (data collection, analysis, recommendations)

SIMULATIONS: Crossing the Chasm (AeroMechanical's FLYHT Challenge), Marker Motion (B2B Marketing Mix)

ASSESSMENT: Class participation (25), Simulations (25), Quizzes (25), Real-life project (50), Capstone (25) = 150 marks total. 60% needed for Certificate of Completion.

ELIGIBILITY: Bachelor's degree + 5 years work experience. Fee: Rs 1,68,000 + Taxes.
"""

# ─── Pydantic Models ───
class OnboardingData(BaseModel):
    professional_experience: str
    current_role: str
    aspirations: str
    linkedin_url: Optional[str] = ""

class ProjectCreate(BaseModel):
    title: str
    description: str
    context: Optional[str] = ""
    group_size: Optional[int] = None
    links: Optional[List[str]] = []

class CaseStudyCreate(BaseModel):
    title: str
    description: str
    context: Optional[str] = ""
    links: Optional[List[str]] = []

class DiscussionCreate(BaseModel):
    title: str
    content: str

class MessageCreate(BaseModel):
    content: str

class ChatbotMessage(BaseModel):
    message: str

# ─── Auth Routes ───
@api_router.post("/auth/session")
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

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return response

# ─── Profile / Onboarding ───
@api_router.put("/profile/onboarding")
async def complete_onboarding(data: OnboardingData, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "professional_experience": data.professional_experience,
            "current_role": data.current_role,
            "aspirations": data.aspirations,
            "linkedin_url": data.linkedin_url,
            "onboarding_complete": True
        }}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@api_router.put("/profile/update")
async def update_profile(data: OnboardingData, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "professional_experience": data.professional_experience,
            "current_role": data.current_role,
            "aspirations": data.aspirations,
            "linkedin_url": data.linkedin_url,
        }}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

# ─── Members / Directory ───
@api_router.get("/members")
async def list_members(request: Request):
    await get_current_user(request)
    members = await db.users.find(
        {"role": "member", "onboarding_complete": True},
        {"_id": 0}
    ).to_list(200)
    return members

@api_router.get("/members/{user_id}")
async def get_member(user_id: str, request: Request):
    await get_current_user(request)
    member = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

# ─── Projects ───
@api_router.get("/projects")
async def list_projects(request: Request):
    await get_current_user(request)
    projects = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    await get_current_user(request)
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    files = await db.files.find({"entity_type": "project", "entity_id": project_id, "is_deleted": False}, {"_id": 0}).to_list(50)
    project["files"] = files
    return project

@api_router.get("/projects/{project_id}/recommendations")
async def get_project_recommendations(project_id: str, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    members = await db.users.find(
        {"role": "member", "onboarding_complete": True, "user_id": {"$ne": user["user_id"]}},
        {"_id": 0}
    ).to_list(200)
    project_keywords = set((project.get("title", "") + " " + project.get("context", "")).lower().split())
    scored = []
    for m in members:
        member_text = (m.get("professional_experience", "") + " " + m.get("current_role", "") + " " + m.get("aspirations", "")).lower()
        member_words = set(member_text.split())
        overlap = len(project_keywords & member_words)
        scored.append((overlap, m))
    scored.sort(key=lambda x: -x[0])
    return [m for _, m in scored[:10]]

# ─── Admin Projects ───
@api_router.post("/admin/projects")
async def create_project(data: ProjectCreate, request: Request):
    await require_admin(request)
    project_id = f"proj_{uuid.uuid4().hex[:10]}"
    doc = {
        "project_id": project_id,
        "title": data.title,
        "description": data.description,
        "context": data.context,
        "group_size": data.group_size,
        "links": data.links,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(doc)
    members = await db.users.find({"role": "member"}, {"_id": 0, "user_id": 1}).to_list(200)
    notifs = [{
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": m["user_id"],
        "type": "new_project",
        "title": "New Project Added",
        "message": f"A new project '{data.title}' has been added.",
        "entity_id": project_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    } for m in members]
    if notifs:
        await db.notifications.insert_many(notifs)
    del doc["_id"]
    return doc

@api_router.put("/admin/projects/{project_id}")
async def update_project(project_id: str, data: ProjectCreate, request: Request):
    await require_admin(request)
    result = await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "title": data.title, "description": data.description,
            "context": data.context, "group_size": data.group_size, "links": data.links
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"project_id": project_id}, {"_id": 0})

@api_router.post("/admin/projects/{project_id}/files")
async def upload_project_file(project_id: str, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    project = await db.projects.find_one({"project_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/projects/{project_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    file_doc = {
        "file_id": f"file_{uuid.uuid4().hex[:10]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "entity_type": "project",
        "entity_id": project_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    del file_doc["_id"]
    return file_doc

# ─── Case Studies ───
@api_router.get("/case-studies")
async def list_case_studies(request: Request):
    await get_current_user(request)
    studies = await db.case_studies.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return studies

@api_router.get("/case-studies/{cs_id}")
async def get_case_study(cs_id: str, request: Request):
    await get_current_user(request)
    cs = await db.case_studies.find_one({"case_study_id": cs_id}, {"_id": 0})
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    files = await db.files.find({"entity_type": "case_study", "entity_id": cs_id, "is_deleted": False}, {"_id": 0}).to_list(50)
    cs["files"] = files
    return cs

@api_router.get("/case-studies/{cs_id}/messages")
async def get_case_study_messages(cs_id: str, request: Request):
    await get_current_user(request)
    messages = await db.case_study_messages.find(
        {"case_study_id": cs_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages

@api_router.post("/case-studies/{cs_id}/messages")
async def post_case_study_message(cs_id: str, data: MessageCreate, request: Request):
    user = await get_current_user(request)
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:10]}",
        "case_study_id": cs_id,
        "author_id": user["user_id"],
        "author_name": user.get("name", "Unknown"),
        "author_picture": user.get("picture", ""),
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.case_study_messages.insert_one(msg)
    del msg["_id"]
    return msg

# ─── Admin Case Studies ───
@api_router.post("/admin/case-studies")
async def create_case_study(data: CaseStudyCreate, request: Request):
    await require_admin(request)
    cs_id = f"cs_{uuid.uuid4().hex[:10]}"
    doc = {
        "case_study_id": cs_id,
        "title": data.title,
        "description": data.description,
        "context": data.context,
        "links": data.links,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.case_studies.insert_one(doc)
    members = await db.users.find({"role": "member"}, {"_id": 0, "user_id": 1}).to_list(200)
    notifs = [{
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": m["user_id"],
        "type": "new_case_study",
        "title": "New Case Study Added",
        "message": f"A new case study '{data.title}' has been added.",
        "entity_id": cs_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    } for m in members]
    if notifs:
        await db.notifications.insert_many(notifs)
    del doc["_id"]
    return doc

@api_router.put("/admin/case-studies/{cs_id}")
async def update_case_study(cs_id: str, data: CaseStudyCreate, request: Request):
    await require_admin(request)
    result = await db.case_studies.update_one(
        {"case_study_id": cs_id},
        {"$set": {"title": data.title, "description": data.description, "context": data.context, "links": data.links}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return await db.case_studies.find_one({"case_study_id": cs_id}, {"_id": 0})

@api_router.post("/admin/case-studies/{cs_id}/files")
async def upload_case_study_file(cs_id: str, request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    cs = await db.case_studies.find_one({"case_study_id": cs_id})
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/case-studies/{cs_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    file_doc = {
        "file_id": f"file_{uuid.uuid4().hex[:10]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "entity_type": "case_study",
        "entity_id": cs_id,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    del file_doc["_id"]
    return file_doc

# ─── Discussions ───
@api_router.get("/discussions")
async def list_discussions(request: Request):
    await get_current_user(request)
    discussions = await db.discussions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in discussions:
        count = await db.discussion_messages.count_documents({"discussion_id": d["discussion_id"]})
        d["message_count"] = count
    return discussions

@api_router.post("/discussions")
async def create_discussion(data: DiscussionCreate, request: Request):
    user = await get_current_user(request)
    disc_id = f"disc_{uuid.uuid4().hex[:10]}"
    doc = {
        "discussion_id": disc_id,
        "title": data.title,
        "content": data.content,
        "author_id": user["user_id"],
        "author_name": user.get("name", "Unknown"),
        "author_picture": user.get("picture", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discussions.insert_one(doc)
    members = await db.users.find(
        {"role": "member", "user_id": {"$ne": user["user_id"]}},
        {"_id": 0, "user_id": 1}
    ).to_list(200)
    notifs = [{
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": m["user_id"],
        "type": "new_discussion",
        "title": "New Discussion",
        "message": f"{user.get('name', 'Someone')} started a discussion: '{data.title}'",
        "entity_id": disc_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    } for m in members]
    if notifs:
        await db.notifications.insert_many(notifs)
    del doc["_id"]
    return doc

@api_router.get("/discussions/{disc_id}/messages")
async def get_discussion_messages(disc_id: str, request: Request):
    await get_current_user(request)
    messages = await db.discussion_messages.find(
        {"discussion_id": disc_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages

@api_router.post("/discussions/{disc_id}/messages")
async def post_discussion_message(disc_id: str, data: MessageCreate, request: Request):
    user = await get_current_user(request)
    msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:10]}",
        "discussion_id": disc_id,
        "author_id": user["user_id"],
        "author_name": user.get("name", "Unknown"),
        "author_picture": user.get("picture", ""),
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discussion_messages.insert_one(msg)
    del msg["_id"]
    return msg

# ─── Chatbot ───
@api_router.post("/chatbot/message")
async def chatbot_send(data: ChatbotMessage, request: Request):
    user = await get_current_user(request)
    user_id = user["user_id"]

    # Build context
    projects = await db.projects.find({}, {"_id": 0, "title": 1, "context": 1, "description": 1}).to_list(100)
    case_studies = await db.case_studies.find({}, {"_id": 0, "title": 1, "context": 1, "description": 1}).to_list(100)

    extra_context = ""
    for p in projects:
        extra_context += f"\n\nProject: {p['title']}\nDescription: {p.get('description', '')}\nContext: {p.get('context', '')}"
    for cs in case_studies:
        extra_context += f"\n\nCase Study: {cs['title']}\nDescription: {cs.get('description', '')}\nContext: {cs.get('context', '')}"

    system_msg = f"""You are the AI assistant for the IIM Kozhikode Advanced Product Management (Batch 06) cohort app.
You help members with questions about the program, projects, case studies, and course curriculum.
Only answer questions relevant to the program and its content. Be concise and helpful.
If asked about something unrelated, politely redirect to program topics.

{PROGRAM_CONTEXT}
{extra_context}"""

    # Get recent history
    history = await db.chat_messages.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    history.reverse()

    # Store user message
    user_msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "role": "user",
        "content": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)

    # Track chatbot interaction for analytics
    await db.chatbot_analytics.insert_one({
        "user_id": user_id,
        "query": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        # Build conversation with history
        chat_session_id = f"iimk_chatbot_{user_id}_{uuid.uuid4().hex[:6]}"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_session_id,
            system_message=system_msg
        )
        chat.with_model("gemini", "gemini-3-flash-preview")

        # Include recent history in the message for context
        history_text = ""
        for h in history[-10:]:
            role = "User" if h["role"] == "user" else "Assistant"
            history_text += f"{role}: {h['content']}\n"

        full_message = f"{history_text}User: {data.message}" if history_text else data.message
        response = await chat.send_message(UserMessage(text=full_message))

        # Store assistant response
        assistant_msg = {
            "message_id": f"msg_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "role": "assistant",
            "content": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(assistant_msg)
        del user_msg_doc["_id"]
        del assistant_msg["_id"]

        return {"user_message": user_msg_doc, "assistant_message": assistant_msg}
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        error_msg = {
            "message_id": f"msg_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "role": "assistant",
            "content": "I'm having trouble processing your request. Please try again.",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(error_msg)
        del error_msg["_id"]
        return {"user_message": user_msg_doc, "assistant_message": error_msg}

@api_router.get("/chatbot/history")
async def chatbot_history(request: Request):
    user = await get_current_user(request)
    messages = await db.chat_messages.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages

@api_router.delete("/chatbot/history")
async def clear_chatbot_history(request: Request):
    user = await get_current_user(request)
    await db.chat_messages.delete_many({"user_id": user["user_id"]})
    return {"message": "Chat history cleared"}

# ─── Notifications ───
@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifs

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one(
        {"notification_id": notif_id, "user_id": user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

# ─── Files ───
@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request, auth: str = Query(None)):
    token = request.cookies.get("session_token")
    if not token and auth:
        token = auth
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ─── Admin Analytics ───
@api_router.get("/admin/analytics")
async def get_analytics(request: Request):
    await require_admin(request)
    total_members = await db.users.count_documents({"role": "member"})
    onboarded = await db.users.count_documents({"role": "member", "onboarding_complete": True})
    total_projects = await db.projects.count_documents({})
    total_case_studies = await db.case_studies.count_documents({})
    total_discussions = await db.discussions.count_documents({})
    total_chatbot_queries = await db.chatbot_analytics.count_documents({})
    total_messages = await db.discussion_messages.count_documents({})

    # Per-member activity
    members = await db.users.find({"role": "member"}, {"_id": 0, "user_id": 1, "name": 1, "email": 1}).to_list(200)
    member_activity = []
    for m in members:
        uid = m["user_id"]
        chat_count = await db.chatbot_analytics.count_documents({"user_id": uid})
        disc_msg_count = await db.discussion_messages.count_documents({"author_id": uid})
        cs_msg_count = await db.case_study_messages.count_documents({"author_id": uid})
        member_activity.append({
            "user_id": uid,
            "name": m.get("name", ""),
            "email": m.get("email", ""),
            "chatbot_queries": chat_count,
            "discussion_messages": disc_msg_count,
            "case_study_messages": cs_msg_count,
            "total_activity": chat_count + disc_msg_count + cs_msg_count
        })
    member_activity.sort(key=lambda x: -x["total_activity"])

    # Recent chatbot queries
    recent_queries = await db.chatbot_analytics.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)

    return {
        "total_members": total_members,
        "onboarded_members": onboarded,
        "total_projects": total_projects,
        "total_case_studies": total_case_studies,
        "total_discussions": total_discussions,
        "total_chatbot_queries": total_chatbot_queries,
        "total_discussion_messages": total_messages,
        "member_activity": member_activity,
        "recent_chatbot_queries": recent_queries
    }

# ─── Admin: Delete Project/Case Study ───
@api_router.delete("/admin/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    await require_admin(request)
    result = await db.projects.delete_one({"project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.files.update_many({"entity_type": "project", "entity_id": project_id}, {"$set": {"is_deleted": True}})
    return {"message": "Project deleted"}

@api_router.delete("/admin/case-studies/{cs_id}")
async def delete_case_study(cs_id: str, request: Request):
    await require_admin(request)
    result = await db.case_studies.delete_one({"case_study_id": cs_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    await db.files.update_many({"entity_type": "case_study", "entity_id": cs_id}, {"$set": {"is_deleted": True}})
    await db.case_study_messages.delete_many({"case_study_id": cs_id})
    return {"message": "Case study deleted"}

# ─── Root Health Endpoint ───
@app.get("/api/")
async def health_check():
    return {"status": "healthy", "service": "cohort-learning-api"}

# ─── Include Router & Middleware ───
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed on startup: {e}")
    logger.info("Server started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
