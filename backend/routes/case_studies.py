import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from core.auth import get_current_user, require_admin
from core.database import db
from core.config import APP_NAME
from core.storage import put_object
from models.schemas import CaseStudyCreate, MessageCreate

router = APIRouter(prefix="/api")

@router.get("/case-studies")
async def list_case_studies(request: Request):
    await get_current_user(request)
    studies = await db.case_studies.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return studies

@router.get("/case-studies/{cs_id}")
async def get_case_study(cs_id: str, request: Request):
    await get_current_user(request)
    cs = await db.case_studies.find_one({"case_study_id": cs_id}, {"_id": 0})
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    files = await db.files.find({"entity_type": "case_study", "entity_id": cs_id, "is_deleted": False}, {"_id": 0}).to_list(50)
    cs["files"] = files
    return cs

@router.get("/case-studies/{cs_id}/messages")
async def get_case_study_messages(cs_id: str, request: Request):
    await get_current_user(request)
    messages = await db.case_study_messages.find(
        {"case_study_id": cs_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages

@router.post("/case-studies/{cs_id}/messages")
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
@router.post("/admin/case-studies")
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

@router.put("/admin/case-studies/{cs_id}")
async def update_case_study(cs_id: str, data: CaseStudyCreate, request: Request):
    await require_admin(request)
    result = await db.case_studies.update_one(
        {"case_study_id": cs_id},
        {"$set": {"title": data.title, "description": data.description, "context": data.context, "links": data.links}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return await db.case_studies.find_one({"case_study_id": cs_id}, {"_id": 0})

@router.delete("/admin/case-studies/{cs_id}")
async def delete_case_study(cs_id: str, request: Request):
    await require_admin(request)
    result = await db.case_studies.delete_one({"case_study_id": cs_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    await db.files.update_many({"entity_type": "case_study", "entity_id": cs_id}, {"$set": {"is_deleted": True}})
    await db.case_study_messages.delete_many({"case_study_id": cs_id})
    return {"message": "Case study deleted"}

@router.post("/admin/case-studies/{cs_id}/files")
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
