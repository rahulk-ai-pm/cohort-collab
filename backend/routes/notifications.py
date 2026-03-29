from fastapi import APIRouter, Request
from core.auth import get_current_user
from core.database import db

router = APIRouter(prefix="/api")

@router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifs

@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one(
        {"notification_id": notif_id, "user_id": user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@router.put("/notifications/read-all")
async def mark_all_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}

@router.delete("/notifications/{notif_id}")
async def dismiss_notification(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.delete_one(
        {"notification_id": notif_id, "user_id": user["user_id"]}
    )
    return {"message": "Notification dismissed"}
