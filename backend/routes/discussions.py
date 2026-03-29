import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from core.auth import get_current_user
from core.database import db
from models.schemas import DiscussionCreate, MessageCreate

router = APIRouter(prefix="/api")

@router.get("/discussions")
async def list_discussions(request: Request):
    await get_current_user(request)
    discussions = await db.discussions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in discussions:
        count = await db.discussion_messages.count_documents({"discussion_id": d["discussion_id"]})
        d["message_count"] = count
    return discussions

@router.post("/discussions")
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

@router.get("/discussions/{disc_id}/messages")
async def get_discussion_messages(disc_id: str, request: Request):
    await get_current_user(request)
    messages = await db.discussion_messages.find(
        {"discussion_id": disc_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages

@router.post("/discussions/{disc_id}/messages")
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

# ─── Discussion Edit/Delete ───
@router.put("/discussions/{disc_id}")
async def edit_discussion(disc_id: str, data: DiscussionCreate, request: Request):
    user = await get_current_user(request)
    disc = await db.discussions.find_one({"discussion_id": disc_id}, {"_id": 0})
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")
    if disc["author_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.discussions.update_one(
        {"discussion_id": disc_id},
        {"$set": {"title": data.title, "content": data.content, "edited_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.discussions.find_one({"discussion_id": disc_id}, {"_id": 0})
    return updated

@router.delete("/discussions/{disc_id}")
async def delete_own_discussion(disc_id: str, request: Request):
    user = await get_current_user(request)
    disc = await db.discussions.find_one({"discussion_id": disc_id}, {"_id": 0})
    if not disc:
        raise HTTPException(status_code=404, detail="Discussion not found")
    if disc["author_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.discussions.delete_one({"discussion_id": disc_id})
    await db.discussion_messages.delete_many({"discussion_id": disc_id})
    return {"message": "Discussion deleted"}

@router.put("/discussions/{disc_id}/messages/{msg_id}")
async def edit_discussion_message(disc_id: str, msg_id: str, data: MessageCreate, request: Request):
    user = await get_current_user(request)
    msg = await db.discussion_messages.find_one({"message_id": msg_id, "discussion_id": disc_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg["author_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.discussion_messages.update_one(
        {"message_id": msg_id},
        {"$set": {"content": data.content, "edited_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.discussion_messages.find_one({"message_id": msg_id}, {"_id": 0})
    return updated

@router.delete("/discussions/{disc_id}/messages/{msg_id}")
async def delete_discussion_message(disc_id: str, msg_id: str, request: Request):
    user = await get_current_user(request)
    msg = await db.discussion_messages.find_one({"message_id": msg_id, "discussion_id": disc_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg["author_id"] != user["user_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.discussion_messages.delete_one({"message_id": msg_id})
    return {"message": "Message deleted"}

# Admin discussion delete
@router.delete("/admin/discussions/{disc_id}")
async def admin_delete_discussion(disc_id: str, request: Request):
    from core.auth import require_admin
    await require_admin(request)
    result = await db.discussions.delete_one({"discussion_id": disc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discussion not found")
    await db.discussion_messages.delete_many({"discussion_id": disc_id})
    return {"message": "Discussion deleted"}
