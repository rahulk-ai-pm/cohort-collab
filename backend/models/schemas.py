from pydantic import BaseModel
from typing import List, Optional

class OnboardingData(BaseModel):
    professional_experience: str
    current_role: str
    aspirations: str
    linkedin_url: Optional[str] = ""
    skills: Optional[List[str]] = []

class ProjectCreate(BaseModel):
    title: str
    description: str
    context: Optional[str] = ""
    group_size: Optional[int] = None
    links: Optional[List[str]] = []
    goals: Optional[str] = ""
    skills_required: Optional[List[str]] = []

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

class TeamPreferenceData(BaseModel):
    preferred_teammates: Optional[List[str]] = []
    skills_offered: Optional[List[str]] = []
    skills_wanted: Optional[List[str]] = []

class TeamSwapData(BaseModel):
    member_id: str
    from_team_id: str
    to_team_id: str
