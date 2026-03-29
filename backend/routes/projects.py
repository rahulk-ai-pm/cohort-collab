import logging
import uuid
import json as json_lib
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from core.auth import get_current_user, require_admin
from core.database import db
from core.config import EMERGENT_LLM_KEY, APP_NAME
from core.storage import put_object
from models.schemas import ProjectCreate, TeamPreferenceData, TeamSwapData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

@router.get("/projects")
async def list_projects(request: Request):
    await get_current_user(request)
    projects = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@router.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    await get_current_user(request)
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    files = await db.files.find({"entity_type": "project", "entity_id": project_id, "is_deleted": False}, {"_id": 0}).to_list(50)
    project["files"] = files
    return project

@router.get("/projects/{project_id}/recommendations")
async def get_project_recommendations(project_id: str, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    members = await db.users.find(
        {"role": "member", "onboarding_complete": True, "user_id": {"$ne": user["user_id"]}},
        {"_id": 0}
    ).to_list(200)
    required_skills = set(s.lower() for s in project.get("skills_required", []))
    project_text = (project.get("title", "") + " " + project.get("context", "") + " " + project.get("goals", "")).lower()
    project_keywords = set(project_text.split())
    scored = []
    for m in members:
        score = 0
        member_skills = set(s.lower() for s in m.get("skills", []))
        score += len(required_skills & member_skills) * 3
        member_text = (m.get("professional_experience", "") + " " + m.get("current_role", "") + " " + m.get("aspirations", "")).lower()
        score += len(project_keywords & set(member_text.split()))
        scored.append((score, m))
    scored.sort(key=lambda x: -x[0])
    return [m for _, m in scored[:10]]

# ─── Team Preferences ───
@router.get("/projects/{project_id}/my-preference")
async def get_my_preference(project_id: str, request: Request):
    user = await get_current_user(request)
    pref = await db.team_preferences.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    return pref or {}

@router.post("/projects/{project_id}/preferences")
async def save_preference(project_id: str, data: TeamPreferenceData, request: Request):
    user = await get_current_user(request)
    existing = await db.team_preferences.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "preferred_teammates": data.preferred_teammates or [],
        "skills_offered": data.skills_offered or [],
        "skills_wanted": data.skills_wanted or [],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if existing:
        await db.team_preferences.update_one(
            {"project_id": project_id, "user_id": user["user_id"]},
            {"$set": doc}
        )
    else:
        doc["preference_id"] = f"pref_{uuid.uuid4().hex[:10]}"
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.team_preferences.insert_one(doc)
    result = await db.team_preferences.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    return result

@router.get("/projects/{project_id}/preferences/count")
async def get_preference_count(project_id: str, request: Request):
    await get_current_user(request)
    count = await db.team_preferences.count_documents({"project_id": project_id})
    return {"count": count}

# ─── Team: Member view ───
@router.get("/projects/{project_id}/my-team")
async def get_my_team(project_id: str, request: Request):
    user = await get_current_user(request)
    team_set = await db.project_teams.find_one(
        {"project_id": project_id, "status": "published"}, {"_id": 0}
    )
    if not team_set:
        return {"status": "not_published"}
    for team in team_set.get("teams", []):
        if user["user_id"] in team.get("members", []):
            member_details = []
            for uid in team["members"]:
                m = await db.users.find_one({"user_id": uid}, {"_id": 0})
                if m:
                    member_details.append(m)
            return {"status": "published", "team": {**team, "member_details": member_details}}
    return {"status": "not_assigned"}

# ─── Admin: Projects ───
@router.post("/admin/projects")
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
        "goals": data.goals,
        "skills_required": data.skills_required or [],
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

@router.put("/admin/projects/{project_id}")
async def update_project(project_id: str, data: ProjectCreate, request: Request):
    await require_admin(request)
    result = await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "title": data.title, "description": data.description,
            "context": data.context, "group_size": data.group_size, "links": data.links,
            "goals": data.goals, "skills_required": data.skills_required or []
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"project_id": project_id}, {"_id": 0})

@router.delete("/admin/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    await require_admin(request)
    result = await db.projects.delete_one({"project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.files.update_many({"entity_type": "project", "entity_id": project_id}, {"$set": {"is_deleted": True}})
    return {"message": "Project deleted"}

@router.post("/admin/projects/{project_id}/files")
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

# ─── Admin: Team Formation ───
@router.get("/admin/projects/{project_id}/preferences")
async def admin_get_preferences(project_id: str, request: Request):
    await require_admin(request)
    prefs = await db.team_preferences.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    return prefs

@router.get("/admin/projects/{project_id}/teams")
async def admin_get_teams(project_id: str, request: Request):
    await require_admin(request)
    team_set = await db.project_teams.find_one(
        {"project_id": project_id}, {"_id": 0},
        sort=[("created_at", -1)]
    )
    if not team_set:
        return None
    for team in team_set.get("teams", []):
        member_details = []
        for uid in team.get("members", []):
            m = await db.users.find_one({"user_id": uid}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "current_role": 1, "skills": 1})
            if m:
                member_details.append(m)
        team["member_details"] = member_details
    return team_set

@router.post("/admin/projects/{project_id}/generate-teams")
async def generate_teams(project_id: str, request: Request):
    await require_admin(request)
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    group_size = project.get("group_size") or 4
    members = await db.users.find(
        {"role": "member", "onboarding_complete": True}, {"_id": 0}
    ).to_list(200)
    if len(members) < 2:
        raise HTTPException(status_code=400, detail="Not enough members to form teams")
    prefs = await db.team_preferences.find({"project_id": project_id}, {"_id": 0}).to_list(200)
    pref_map = {p["user_id"]: p for p in prefs}

    member_summaries = []
    for m in members:
        skills = m.get("skills", [])
        pref = pref_map.get(m["user_id"], {})
        member_summaries.append({
            "id": m["user_id"],
            "name": m.get("name", "Unknown"),
            "role": m.get("current_role", ""),
            "skills": skills,
            "skills_offered": pref.get("skills_offered", skills),
            "skills_wanted": pref.get("skills_wanted", []),
            "preferred_teammates": pref.get("preferred_teammates", [])
        })

    num_teams = max(1, len(members) // group_size)

    prompt = f"""You are forming teams for a product management project.

PROJECT: {project.get('title', '')}
GOALS: {project.get('goals', '')}
SKILLS REQUIRED: {', '.join(project.get('skills_required', []))}
TARGET TEAM SIZE: {group_size}
NUMBER OF TEAMS NEEDED: {num_teams} (with {len(members)} total members)

MEMBERS:
{json_lib.dumps(member_summaries, indent=2)}

RULES:
1. Every member MUST be assigned to exactly one team. No one left out.
2. Respect mutual preferences (if A wants B and B wants A, put them together).
3. Each team should have diverse skills covering as many of the required project skills as possible.
4. Balance professional diversity across teams.
5. Team sizes should be as equal as possible ({group_size} per team, last team can be +/- 1).

Return ONLY a valid JSON array of teams. Each team object must have:
- "team_name": a short creative name (e.g., "Alpha Strategists")
- "members": array of member id strings

Example format:
[{{"team_name": "Team Alpha", "members": ["user_abc", "user_def"]}}, ...]

Return ONLY the JSON array, no other text."""

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"team_gen_{project_id}_{uuid.uuid4().hex[:6]}",
            system_message="You are a team formation assistant. Return ONLY valid JSON."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=prompt))

        response_clean = response.strip()
        if response_clean.startswith("```"):
            response_clean = response_clean.split("\n", 1)[1] if "\n" in response_clean else response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]
            response_clean = response_clean.strip()
        if response_clean.startswith("json"):
            response_clean = response_clean[4:].strip()

        teams_data = json_lib.loads(response_clean)

        assigned = set()
        for t in teams_data:
            for mid in t.get("members", []):
                assigned.add(mid)

        all_member_ids = {m["user_id"] for m in members}
        unassigned = all_member_ids - assigned
        if unassigned:
            unassigned_list = list(unassigned)
            for i, uid in enumerate(unassigned_list):
                teams_data[i % len(teams_data)]["members"].append(uid)

        teams = []
        for i, t in enumerate(teams_data):
            teams.append({
                "team_id": f"team_{uuid.uuid4().hex[:8]}",
                "team_name": t.get("team_name", f"Team {i+1}"),
                "members": t.get("members", [])
            })

        team_set_id = f"ts_{uuid.uuid4().hex[:10]}"
        team_doc = {
            "team_set_id": team_set_id,
            "project_id": project_id,
            "status": "draft",
            "teams": teams,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_at": None
        }
        await db.project_teams.delete_many({"project_id": project_id, "status": "draft"})
        await db.project_teams.insert_one(team_doc)
        del team_doc["_id"]
        return team_doc

    except Exception as e:
        logger.error(f"Team generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Team generation failed: {str(e)}")

@router.put("/admin/projects/{project_id}/teams/swap")
async def swap_team_member(project_id: str, data: TeamSwapData, request: Request):
    await require_admin(request)
    team_set = await db.project_teams.find_one({"project_id": project_id, "status": "draft"})
    if not team_set:
        raise HTTPException(status_code=404, detail="No draft teams found")
    teams = team_set["teams"]
    from_team = next((t for t in teams if t["team_id"] == data.from_team_id), None)
    to_team = next((t for t in teams if t["team_id"] == data.to_team_id), None)
    if not from_team or not to_team:
        raise HTTPException(status_code=404, detail="Team not found")
    if data.member_id not in from_team["members"]:
        raise HTTPException(status_code=400, detail="Member not in source team")
    from_team["members"].remove(data.member_id)
    to_team["members"].append(data.member_id)
    await db.project_teams.update_one(
        {"project_id": project_id, "status": "draft"},
        {"$set": {"teams": teams}}
    )
    return {"message": "Member swapped"}

@router.post("/admin/projects/{project_id}/publish-teams")
async def publish_teams(project_id: str, request: Request):
    await require_admin(request)
    team_set = await db.project_teams.find_one({"project_id": project_id, "status": "draft"})
    if not team_set:
        raise HTTPException(status_code=404, detail="No draft teams to publish")
    await db.project_teams.delete_many({"project_id": project_id, "status": "published"})
    await db.project_teams.update_one(
        {"project_id": project_id, "status": "draft"},
        {"$set": {"status": "published", "published_at": datetime.now(timezone.utc).isoformat()}}
    )
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0, "title": 1})
    members = await db.users.find({"role": "member"}, {"_id": 0, "user_id": 1}).to_list(200)
    notifs = [{
        "notification_id": f"notif_{uuid.uuid4().hex[:10]}",
        "user_id": m["user_id"],
        "type": "teams_published",
        "title": "Teams Published",
        "message": f"Teams for '{project.get('title', 'Project')}' have been published. Check your team!",
        "entity_id": project_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    } for m in members]
    if notifs:
        await db.notifications.insert_many(notifs)
    return {"message": "Teams published"}
