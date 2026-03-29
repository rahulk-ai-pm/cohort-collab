import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from core.auth import get_current_user
from core.database import db
from core.config import EMERGENT_LLM_KEY, PROGRAM_CONTEXT
from models.schemas import ChatbotMessage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

@router.post("/chatbot/message")
async def chatbot_send(data: ChatbotMessage, request: Request):
    user = await get_current_user(request)
    user_id = user["user_id"]

    projects = await db.projects.find({}, {"_id": 0, "title": 1, "context": 1, "description": 1}).to_list(100)
    case_studies = await db.case_studies.find({}, {"_id": 0, "title": 1, "context": 1, "description": 1}).to_list(100)

    extra_context = ""
    for p in projects:
        extra_context += f"\n\nProject: {p['title']}\nDescription: {p.get('description', '')}\nContext: {p.get('context', '')}"
    for cs in case_studies:
        extra_context += f"\n\nCase Study: {cs['title']}\nDescription: {cs.get('description', '')}\nContext: {cs.get('context', '')}"

    system_msg = f"""You are the AI assistant for the IIM Kozhikode Advanced Product Management (Batch 06) cohort app.
You help members with questions about the program, projects, case studies, and course curriculum.
Only answer questions relevant to the program and its content. Be concise and helpful.
If asked about something unrelated, politely redirect to program topics.

{PROGRAM_CONTEXT}
{extra_context}"""

    history = await db.chat_messages.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    history.reverse()

    user_msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "role": "user",
        "content": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)
    user_msg_doc.pop("_id", None)

    analytics_doc = {
        "user_id": user_id,
        "query": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chatbot_analytics.insert_one(analytics_doc)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat_session_id = f"iimk_chatbot_{user_id}_{uuid.uuid4().hex[:6]}"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_session_id,
            system_message=system_msg
        )
        chat.with_model("gemini", "gemini-3-flash-preview")

        history_text = ""
        for h in history[-10:]:
            role = "User" if h["role"] == "user" else "Assistant"
            history_text += f"{role}: {h['content']}\n"

        full_message = f"{history_text}User: {data.message}" if history_text else data.message
        response = await chat.send_message(UserMessage(text=full_message))

        assistant_msg = {
            "message_id": f"msg_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "role": "assistant",
            "content": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(assistant_msg)
        assistant_msg.pop("_id", None)

        return {"user_message": user_msg_doc, "assistant_message": assistant_msg}
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        error_msg = {
            "message_id": f"msg_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "role": "assistant",
            "content": "I'm having trouble processing your request. Please try again.",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(error_msg)
        error_msg.pop("_id", None)
        return {"user_message": user_msg_doc, "assistant_message": error_msg}

@router.get("/chatbot/history")
async def chatbot_history(request: Request):
    user = await get_current_user(request)
    messages = await db.chat_messages.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages

@router.delete("/chatbot/history")
async def clear_chatbot_history(request: Request):
    user = await get_current_user(request)
    await db.chat_messages.delete_many({"user_id": user["user_id"]})
    return {"message": "Chat history cleared"}
