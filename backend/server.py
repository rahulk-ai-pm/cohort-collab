import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

# Ensure backend dir is in sys.path for module imports
ROOT_DIR = Path(__file__).parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from core.config import *  # noqa: F401,F403 - loads .env
from core.database import client
from core.storage import init_storage

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# ─── Import & Register Route Modules ───
from routes.auth import router as auth_router
from routes.members import router as members_router
from routes.projects import router as projects_router
from routes.case_studies import router as case_studies_router
from routes.discussions import router as discussions_router
from routes.chatbot import router as chatbot_router
from routes.notifications import router as notifications_router
from routes.files import router as files_router
from routes.admin import router as admin_router

app.include_router(auth_router)
app.include_router(members_router)
app.include_router(projects_router)
app.include_router(case_studies_router)
app.include_router(discussions_router)
app.include_router(chatbot_router)
app.include_router(notifications_router)
app.include_router(files_router)
app.include_router(admin_router)

# ─── Health Check ───
@app.get("/api/")
async def health_check():
    return {"status": "healthy", "service": "cohort-learning-api"}

# ─── CORS Middleware ───
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
