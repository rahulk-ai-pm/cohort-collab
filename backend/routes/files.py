import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Response, Query
from core.database import db
from core.config import EMERGENT_LLM_KEY
from core.storage import get_object

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

@router.get("/files/{path:path}")
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

@router.post("/admin/files/{file_id}/summarize")
async def summarize_file(file_id: str, request: Request):
    from core.auth import require_admin
    await require_admin(request)
    file_doc = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, _ = get_object(file_doc["storage_path"])
    except Exception:
        raise HTTPException(status_code=500, detail="Could not retrieve file from storage")
    text = ""
    ct = (file_doc.get("content_type") or "").lower()
    if "pdf" in ct:
        import io
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(data))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    else:
        try:
            text = data.decode("utf-8")
        except Exception:
            text = data.decode("latin-1", errors="ignore")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summarize_{file_id}_{uuid.uuid4().hex[:6]}",
            system_message="You are a document summarizer for an IIM Kozhikode Advanced Product Management program. Provide a clear, structured summary with key points."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=f"Please summarize the following document content concisely with key points:\n\n{text[:15000]}"))
        await db.files.update_one(
            {"file_id": file_id},
            {"$set": {"summary": response, "summarized_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"file_id": file_id, "summary": response}
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.get("/files/{file_id}/summary")
async def get_file_summary(file_id: str, request: Request):
    from core.auth import get_current_user
    await get_current_user(request)
    file_doc = await db.files.find_one({"file_id": file_id, "is_deleted": False}, {"_id": 0, "summary": 1, "file_id": 1, "original_filename": 1})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    return file_doc
