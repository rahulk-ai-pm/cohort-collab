import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from core.auth import require_admin
from core.database import db

router = APIRouter(prefix="/api")

# ─── Admin: Member Management ───
@router.get("/admin/members")
async def admin_list_members(request: Request):
    await require_admin(request)
    members = await db.users.find({"role": "member"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    blocked_emails = await db.blocked_emails.find({}, {"_id": 0}).to_list(200)
    blocked_set = {b["email"] for b in blocked_emails}
    for m in members:
        m["is_blocked"] = m.get("email", "") in blocked_set
    return members

@router.delete("/admin/members/{user_id}")
async def admin_remove_member(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot remove admin")
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.chat_messages.delete_many({"user_id": user_id})
    await db.chatbot_analytics.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    await db.team_preferences.delete_many({"user_id": user_id})
    return {"message": f"Member {user.get('name', user_id)} removed"}

@router.post("/admin/members/{user_id}/block")
async def admin_block_member(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot block admin")
    email = user.get("email", "")
    if email:
        await db.blocked_emails.update_one(
            {"email": email},
            {"$set": {"email": email, "user_id": user_id, "name": user.get("name", ""), "blocked_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"message": f"Member {user.get('name', user_id)} blocked"}

@router.delete("/admin/members/{user_id}/block")
async def admin_unblock_member(user_id: str, request: Request):
    await require_admin(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    email = user.get("email", "")
    if email:
        await db.blocked_emails.delete_one({"email": email})
    return {"message": f"Member {user.get('name', user_id)} unblocked"}

@router.get("/admin/blocked")
async def admin_list_blocked(request: Request):
    await require_admin(request)
    blocked = await db.blocked_emails.find({}, {"_id": 0}).to_list(200)
    return blocked

# ─── Admin: Analytics ───
@router.get("/admin/analytics")
async def get_analytics(request: Request):
    await require_admin(request)

    total_members = await db.users.count_documents({"role": "member"})
    onboarded = await db.users.count_documents({"role": "member", "onboarding_complete": True})
    total_projects = await db.projects.count_documents({})
    total_case_studies = await db.case_studies.count_documents({})
    total_discussions = await db.discussions.count_documents({})
    total_chatbot_queries = await db.chatbot_analytics.count_documents({})
    total_messages = await db.discussion_messages.count_documents({})
    total_cs_messages = await db.case_study_messages.count_documents({})
    total_files = await db.files.count_documents({"is_deleted": False})

    # Per-member activity
    members = await db.users.find({"role": "member"}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "picture": 1, "onboarding_complete": 1, "created_at": 1}).to_list(200)
    member_activity = []
    for m in members:
        uid = m["user_id"]
        chat_count = await db.chatbot_analytics.count_documents({"user_id": uid})
        disc_msg_count = await db.discussion_messages.count_documents({"author_id": uid})
        cs_msg_count = await db.case_study_messages.count_documents({"author_id": uid})
        disc_created = await db.discussions.count_documents({"author_id": uid})
        member_activity.append({
            "user_id": uid,
            "name": m.get("name", ""),
            "email": m.get("email", ""),
            "picture": m.get("picture", ""),
            "chatbot_queries": chat_count,
            "discussion_messages": disc_msg_count,
            "discussions_created": disc_created,
            "case_study_messages": cs_msg_count,
            "total_activity": chat_count + disc_msg_count + cs_msg_count + disc_created
        })
    member_activity.sort(key=lambda x: -x["total_activity"])

    # Recent chatbot queries (with user info)
    recent_queries = await db.chatbot_analytics.find({}, {"_id": 0}).sort("created_at", -1).to_list(30)
    user_cache = {}
    for q in recent_queries:
        uid = q.get("user_id")
        if uid and uid not in user_cache:
            u = await db.users.find_one({"user_id": uid}, {"_id": 0, "name": 1, "picture": 1})
            user_cache[uid] = u or {}
        q["user_name"] = user_cache.get(uid, {}).get("name", "Unknown")
        q["user_picture"] = user_cache.get(uid, {}).get("picture", "")

    # Daily activity for last 30 days
    now = datetime.now(timezone.utc)
    daily_activity = []
    for i in range(29, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = (day.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).isoformat()
        date_filter = {"created_at": {"$gte": day_start, "$lt": day_end}}

        chatbot_count = await db.chatbot_analytics.count_documents(date_filter)
        disc_msg_count = await db.discussion_messages.count_documents(date_filter)
        cs_msg_count = await db.case_study_messages.count_documents(date_filter)
        disc_count = await db.discussions.count_documents(date_filter)

        daily_activity.append({
            "date": day.strftime("%b %d"),
            "chatbot": chatbot_count,
            "discussions": disc_msg_count + disc_count,
            "case_studies": cs_msg_count,
            "total": chatbot_count + disc_msg_count + cs_msg_count + disc_count
        })

    # Skills distribution across members
    skills_dist = {}
    all_members = await db.users.find({"role": "member", "onboarding_complete": True}, {"_id": 0, "skills": 1}).to_list(200)
    for m in all_members:
        for s in m.get("skills", []):
            skills_dist[s] = skills_dist.get(s, 0) + 1
    skills_chart = [{"skill": k, "count": v} for k, v in sorted(skills_dist.items(), key=lambda x: -x[1])]

    # Onboarding funnel
    pending = total_members - onboarded
    blocked_count = await db.blocked_emails.count_documents({})

    # Engagement rate (members with any activity / total onboarded)
    active_members = sum(1 for m in member_activity if m["total_activity"] > 0)
    engagement_rate = round((active_members / onboarded * 100) if onboarded > 0 else 0, 1)

    return {
        "total_members": total_members,
        "onboarded_members": onboarded,
        "pending_members": pending,
        "blocked_members": blocked_count,
        "total_projects": total_projects,
        "total_case_studies": total_case_studies,
        "total_discussions": total_discussions,
        "total_chatbot_queries": total_chatbot_queries,
        "total_discussion_messages": total_messages,
        "total_cs_messages": total_cs_messages,
        "total_files": total_files,
        "engagement_rate": engagement_rate,
        "active_members": active_members,
        "member_activity": member_activity,
        "recent_chatbot_queries": recent_queries,
        "daily_activity": daily_activity,
        "skills_distribution": skills_chart,
    }
