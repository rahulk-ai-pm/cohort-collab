# PRD - IIMK APM Batch 06 Cohort App

## Original Problem Statement
Build a cohort learning app for the IIM Kozhikode Advanced Product Management (Batch 06) program with 92 members. Features include admin interface, member interface, and AI chatbot.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (test_database)
- **Auth**: Emergent-managed Google OAuth
- **AI Chatbot**: Gemini 3 Flash via Emergent Universal Key
- **File Storage**: Emergent Object Storage
- **Design**: Neo-Material, light theme, Cabinet Grotesk + Manrope fonts

## User Personas
1. **Admin** (vrk.bluestacks@gmail.com) - Manages projects, case studies, uploads files, views analytics
2. **Members** (92 cohort participants) - View projects/case studies, participate in discussions, use chatbot, find peers

## Core Requirements
- Google OAuth sign-in
- Profile onboarding (experience, role, aspirations, LinkedIn)
- Cohort directory with search
- Discussion forum with threaded replies
- Projects with peer recommendations based on profile matching
- Case studies with cohort-wide discussion chat
- AI chatbot (Gemini 3 Flash) with program/project/case study context
- Admin CRUD for projects and case studies with file upload
- Admin analytics (member activity, chatbot queries)
- Notification system for new content

## What's Been Implemented (March 29, 2026)
- [x] Google OAuth authentication flow
- [x] Profile onboarding (with skills selection)
- [x] Member dashboard with stats and notifications
- [x] Cohort directory with search (shows skills badges)
- [x] Discussion forum (create, reply)
- [x] Projects listing and detail with peer recommendations
- [x] Case studies with cohort-wide chat
- [x] AI Chatbot (Gemini 3 Flash) with dynamic context
- [x] Admin dashboard (projects, case studies, analytics)
- [x] File upload via Emergent Object Storage
- [x] Notification system
- [x] Responsive design
- [x] **Team Formation Workflow** (March 29, 2026)
  - Admin sets project goals + required skills
  - Members select skills during onboarding
  - Members submit team preferences (preferred teammates, skills offered/wanted)
  - AI-powered team generation via Gemini 3 Flash (respects preferences, balances skills)
  - Admin reviews draft teams, can swap members
  - Admin publishes teams → all members notified
  - Members see their assigned team under project detail

  - [x] **Admin Moderation** (March 29, 2026)
    - Delete discussions (and all associated messages)
    - Remove members (deletes account, sessions, chat history, preferences, notifications)
    - Block members (adds to blocked emails list, kills sessions, prevents re-sign-up)
    - Unblock members
    - Members tab with search, status badges (Active/Pending/Blocked), and action buttons

## Testing Results
- Iteration 1: Backend 100% (20/20), Frontend 95%
- Iteration 2 (Team Formation): Backend 100% (13/13), Frontend 100%
- Iteration 3 (Admin Moderation): Backend 100% (14/14), Frontend 100%

## Prioritized Backlog

### P0 (Critical)
- All core features implemented

### P1 (High Priority)
- Real-time updates for discussions (WebSocket)
- Profile editing for members post-onboarding
- File preview/download in project and case study detail pages
- Chatbot conversation context from uploaded file content (PDF text extraction)

### P2 (Medium Priority)
- Member search filters (by role, aspirations, skills)
- Discussion categories/tags
- Rich text editor for discussions
- Email notifications for important updates
- Case study-specific chatbot context mode
- Admin bulk operations

### P3 (Nice to Have)
- Dark mode toggle
- Export analytics as CSV
- Member activity feed
- Direct messaging between members
- Project team formation workflow
- Calendar integration for class schedule
