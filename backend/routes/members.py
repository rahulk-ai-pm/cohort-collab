from fastapi import APIRouter, Request
from core.auth import get_current_user
from core.database import db
from core.config import APM_SKILLS
from models.schemas import OnboardingData

router = APIRouter(prefix="/api")

@router.put("/profile/onboarding")
async def complete_onboarding(data: OnboardingData, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "professional_experience": data.professional_experience,
            "current_role": data.current_role,
            "aspirations": data.aspirations,
            "linkedin_url": data.linkedin_url,
            "skills": data.skills or [],
            "residing_in": data.residing_in or "",
            "onboarding_complete": True
        }}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@router.put("/profile/update")
async def update_profile(data: OnboardingData, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "professional_experience": data.professional_experience,
            "current_role": data.current_role,
            "aspirations": data.aspirations,
            "linkedin_url": data.linkedin_url,
            "skills": data.skills or [],
            "residing_in": data.residing_in or "",
        }}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return updated

@router.get("/members")
async def list_members(request: Request):
    await get_current_user(request)
    members = await db.users.find(
        {"role": "member", "onboarding_complete": True},
        {"_id": 0}
    ).to_list(200)
    return members

@router.get("/members/{user_id}")
async def get_member(user_id: str, request: Request):
    await get_current_user(request)
    member = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not member:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Member not found")
    return member

@router.get("/skills")
async def get_skills_list(request: Request):
    await get_current_user(request)
    return APM_SKILLS
