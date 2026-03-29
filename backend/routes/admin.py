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

    # Bulk per-member activity using aggregation pipelines
    members = await db.users.find(
        {"role": "member"},
        {"_id": 0, "user_id": 1, "name": 1, "email": 1, "picture": 1, "onboarding_complete": 1, "created_at": 1}
    ).to_list(200)

    member_ids = [m["user_id"] for m in members]

    # 4 bulk aggregation queries instead of N*4
    chat_counts_agg = await db.chatbot_analytics.aggregate([
        {"$match": {"user_id": {"$in": member_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(300)
    chat_map = {c["_id"]: c["count"] for c in chat_counts_agg}

    disc_msg_agg = await db.discussion_messages.aggregate([
        {"$match": {"author_id": {"$in": member_ids}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}}
    ]).to_list(300)
    disc_msg_map = {c["_id"]: c["count"] for c in disc_msg_agg}

    cs_msg_agg = await db.case_study_messages.aggregate([
        {"$match": {"author_id": {"$in": member_ids}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}}
    ]).to_list(300)
    cs_msg_map = {c["_id"]: c["count"] for c in cs_msg_agg}

    disc_created_agg = await db.discussions.aggregate([
        {"$match": {"author_id": {"$in": member_ids}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}}
    ]).to_list(300)
    disc_created_map = {c["_id"]: c["count"] for c in disc_created_agg}

    member_activity = []
    for m in members:
        uid = m["user_id"]
        chat_count = chat_map.get(uid, 0)
        disc_msg_count = disc_msg_map.get(uid, 0)
        cs_msg_count = cs_msg_map.get(uid, 0)
        disc_created = disc_created_map.get(uid, 0)
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

    # Recent chatbot queries — bulk fetch users with $in
    recent_queries = await db.chatbot_analytics.find({}, {"_id": 0}).sort("created_at", -1).to_list(30)
    query_user_ids = list({q.get("user_id") for q in recent_queries if q.get("user_id")})
    user_docs = await db.users.find(
        {"user_id": {"$in": query_user_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
    ).to_list(100)
    user_cache = {u["user_id"]: u for u in user_docs}
    for q in recent_queries:
        uid = q.get("user_id")
        cached = user_cache.get(uid, {})
        q["user_name"] = cached.get("name", "Unknown")
        q["user_picture"] = cached.get("picture", "")

    # Daily activity for last 30 days — 4 bulk aggregation queries
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    date_group_stage = {
        "$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1}
        }
    }
    date_match = {"$match": {"created_at": {"$gte": thirty_days_ago}}}

    chatbot_daily = await db.chatbot_analytics.aggregate([date_match, date_group_stage]).to_list(60)
    chatbot_daily_map = {c["_id"]: c["count"] for c in chatbot_daily}

    disc_msg_daily = await db.discussion_messages.aggregate([date_match, date_group_stage]).to_list(60)
    disc_daily_agg = await db.discussions.aggregate([date_match, date_group_stage]).to_list(60)
    disc_daily_map = {}
    for c in disc_msg_daily:
        disc_daily_map[c["_id"]] = disc_daily_map.get(c["_id"], 0) + c["count"]
    for c in disc_daily_agg:
        disc_daily_map[c["_id"]] = disc_daily_map.get(c["_id"], 0) + c["count"]

    cs_msg_daily = await db.case_study_messages.aggregate([date_match, date_group_stage]).to_list(60)
    cs_daily_map = {c["_id"]: c["count"] for c in cs_msg_daily}

    daily_activity = []
    for i in range(29, -1, -1):
        day = now - timedelta(days=i)
        day_key = day.strftime("%Y-%m-%d")
        day_label = day.strftime("%b %d")
        chatbot_count = chatbot_daily_map.get(day_key, 0)
        disc_count = disc_daily_map.get(day_key, 0)
        cs_count = cs_daily_map.get(day_key, 0)
        daily_activity.append({
            "date": day_label,
            "chatbot": chatbot_count,
            "discussions": disc_count,
            "case_studies": cs_count,
            "total": chatbot_count + disc_count + cs_count
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

    # Engagement rate
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
