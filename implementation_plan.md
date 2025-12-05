# Implementation Plan - Chitchat (Gurukul)

## Phase 1: Core Foundation & UI Overhaul (Completed)
- [x] **Project Setup**: Initialize Next.js 14, Tailwind CSS, Shadcn UI.
- [x] **Authentication**: Supabase Auth (Email/Password, GitHub/Google).
- [x] **Database Schema**: Users, Profiles, Rooms, Messages tables.
- [x] **App Shell**: Sidebar, TopBar, Responsive Layout.
- [x] **Theme Engine**: "Vedic" Dark Mode (Orange/Black), Glassmorphism.
- [x] **Landing Page**: Hero section with 3D elements (Spline/Three.js concept).

## Phase 2: Real-time Communication (In Progress)
- [x] **Text Chat**: Real-time messaging with Supabase Realtime.
- [x] **Voice/Video**: LiveKit integration for high-quality calls.
- [x] **Screen Sharing**: LiveKit screen sharing capability.
- [x] **Global Call Manager**: Persistent call overlay with Embedded/Mini-Player modes.
- [x] **Embedded Video**: Seamless video integration within room layout (Portal-based).
- [x] **Mini-Player**: Draggable video/voice participant view.
- [x] **File Sharing**: Upload images/docs in chat (Drag & Drop, Copy/Paste).
- [x] **Rich Text Editor**: Markdown support for messages.
- [x] **Message Actions**: Reply, Edit, Delete, Copy.

## Phase 3: Study Room Features (In Progress)
- [x] **Room Creation**: UI for creating public/private rooms.
- [x] **Room Discovery**: "Sangha" page grid view of active rooms.
- [x] **Whiteboard**: Excalidraw integration (Replaced Tldraw).
- [x] **Channels**: Dynamic text/voice/canvas channels per room.
- [x] **Server Settings**: Rename server, create/delete channels, manage roles.
- [x] **Link Detection**: Auto-link URLs in chat messages (DM & Room).
- [x] **Sidebar Improvements**: Real data for members (with 'You' indicator) and files list.
- [x] **Whiteboard Persistence**: Save/Load drawings to Supabase Storage.
- [x] **Pomodoro Timer**: Shared timer for study sessions.
- [x] **Music Player**: Lo-fi radio integration (YouTube/Spotify embed).
- [x] **Server Settings Polish**: Improved image upload reliability and UI feedback.
- [x] **Sidebar UX**: Unified dark theme and added quick access Dashboard icon.

## Phase 4: User Profile & Settings (Current Focus)
- [x] **Profile Page**: View user details, avatar, bio.
- [x] **Settings Page**: "Bento Grid" layout for editing profile.
- [x] **Avatar Upload**: Real image upload to Supabase Storage.
- [x] **College Verification**: Verify student status via `.edu` email or ID upload (Pro Feature).

## Phase 5: Community & Gamification (Planned)
- [x] **Servers/Channels**: Discord-like server structure (Backend implemented).
  - *Update*: Implemented custom, native-like context menus for servers and channels, replacing browser defaults.
- [x] **Roles & Permissions**: Full Role-Based Access Control (RBAC) with custom roles, RLS policies, and Admin tools (e.g., Delete Channel).
- [x] **XP System**: Earn points for study time (Mock UI exists).
- [ ] **Leaderboards**: Weekly/Monthly top students.

## Phase 6: Mobile & Performance (Planned)
- [ ] **Mobile Responsiveness**: Optimize all views for mobile.
- [ ] **PWA Support**: Installable web app.
- [ ] **Virtualization**: Optimize chat list for large history.
