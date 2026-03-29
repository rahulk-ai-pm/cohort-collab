# PRD - IIMK APM Batch 06 Cohort App

## Original Problem Statement
Build a cohort learning app for the IIM Kozhikode Advanced Product Management (Batch 06) program with 92 members. Features include admin interface, member interface, and AI chatbot.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI + Motor (async MongoDB) — modular structure
- **Database**: MongoDB (test_database)
- **Auth**: Emergent-managed Google OAuth
- **AI Chatbot**: Gemini 3 Flash via Emergent Universal Key
- **File Storage**: Emergent Object Storage
- **Design**: Neo-Material, light theme, Cabinet Grotesk + Manrope fonts

### Backend Structure (Refactored March 29, 2026)
```
/app/backend/
├── server.py              # Thin orchestrator: imports routers, middleware, startup
├── core/
│   ├── config.py          # Environment vars, constants, program context
│   ├── database.py        # MongoDB client + db connection
│   ├── storage.py         # Emergent Object Storage helpers
│   └── auth.py            # get_current_user, require_admin
├── models/
│   └── schemas.py         # All Pydantic request models
├── routes/
│   ├── auth.py            # /api/auth/* (session exchange, me, logout)
│   ├── members.py         # /api/members/*, /api/profile/*, /api/skills
│   ├── projects.py        # /api/projects/*, admin CRUD, team formation
│   ├── case_studies.py    # /api/case-studies/*, admin CRUD
│   ├── discussions.py     # /api/discussions/*, edit/delete, admin delete
│   ├── chatbot.py         # /api/chatbot/*
│   ├── notifications.py   # /api/notifications/*
│   ├── files.py           # /api/files/*, summarize
│   └── admin.py           # /api/admin/analytics, member management
└── requirements.txt
```

## User Personas
1. **Admin** (vrk.bluestacks@gmail.com) - Manages projects, case studies, uploads files, views analytics
2. **Members** (92 cohort participants) - View projects/case studies, participate in discussions, use chatbot, find peers

## What's Been Implemented
- [x] Google OAuth authentication flow
- [x] Profile onboarding (with skills selection + custom skills)
- [x] Member dashboard with stats and notifications
- [x] Cohort directory with search (shows skills badges)
- [x] Discussion forum (create, reply, rich text editor)
- [x] Projects listing and detail with peer recommendations
- [x] Case studies with cohort-wide chat
- [x] AI Chatbot (Gemini 3 Flash) with dynamic context
- [x] Admin dashboard (projects, case studies, analytics)
- [x] File upload via Emergent Object Storage
- [x] AI file summarization endpoint
- [x] Notification system
- [x] Responsive design
- [x] Team Formation Workflow (AI-powered via Gemini)
- [x] Admin Moderation (delete discussions, block/remove members)
- [x] Member Self-Service (edit profile, own discussions)
- [x] **Backend Refactoring** (March 29, 2026) — Split 1320-line server.py into modular route/core files
- [x] **Comprehensive Admin Analytics** (March 29, 2026):
  - Activity trend chart (30-day area chart: chatbot, discussions, case studies)
  - Member status donut chart (onboarded/pending/blocked)
  - Skills distribution horizontal bar chart
  - Content summary sidebar
  - Member activity ranking table
  - Recent chatbot queries feed with user info

## Testing Results
- Iteration 1: Backend 100%, Frontend 95%
- Iteration 2: Backend 100%, Frontend 100%
- Iteration 3: Backend 100%, Frontend 100%
- Iteration 4: Backend 96.7%, Frontend 95% → chatbot fix applied
- Iteration 5 (Refactoring + Analytics): Backend 100%, Frontend 100%

## Prioritized Backlog

### P1 (High Priority)
- Real-time updates for discussions (WebSocket)
- Chatbot conversation context from uploaded file content (PDF text extraction)

### P2 (Medium Priority) — Deferred by user
- Member-to-member direct messaging
- Email notifications
- Member search filters (by role, aspirations, skills)
- Discussion categories/tags
- Admin bulk operations
- Export analytics as CSV

### P3 (Nice to Have)
- Dark mode toggle
- Member activity feed
- Calendar integration for class schedule
