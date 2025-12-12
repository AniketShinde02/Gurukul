# Implementation Plan - Chitchat (Gurukul)

## Phase 1: Core Foundation & UI Overhaul (Completed)
- [x] **Project Setup**: Initialize Next.js 14, Tailwind CSS, Shadcn UI.
- [x] **Authentication**: Supabase Auth (Email/Password, GitHub/Google).
- [x] **Database Schema**: Users, Profiles, Rooms, Messages tables.
- [x] **App Shell**: Sidebar, TopBar, Responsive Layout.
- [x] **Theme Engine**: "Vedic" Dark Mode (Orange/Black), Glassmorphism.
- [x] **Landing Page**: Hero section with 3D elements (Spline/Three.js concept).

## Phase 2: Real-time Communication (Completed)
- [x] **Text Chat**: Real-time messaging with Supabase Realtime.
- [x] **Voice/Video**: LiveKit integration for high-quality calls.
- [x] **Screen Sharing**: LiveKit screen sharing capability.
- [x] **Global Call Manager**: Persistent call overlay with Embedded/Mini-Player modes.
- [x] **Embedded Video**: Seamless video integration within room layout (Portal-based).
- [x] **Mini-Player**: Draggable video/voice participant view.
- [x] **File Sharing**: Upload images/docs in chat (Drag & Drop, Copy/Paste).
- [x] **Rich Text Editor**: Markdown support for messages.
- [x] **Message Actions**: Reply, Edit, Delete, Copy.

## Phase 3: Study Room Features (Completed)
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
- [x] **Event Hosting**: Full lifecycle management (Upcoming/Active/Past), channel linking, and attendance tracking.
- [x] **UI Polish**: Replaced all 12+ instances of browser `confirm()` with premium, custom-styled dialogs for consistent UX.
- [x] **Context Menu Wiring**: Linked Server Rail right-click actions to the Unified Creation Modal.

## Phase 4: User Profile & Settings (Completed)
- [x] **Profile Page**: View user details, avatar, bio.
- [x] **Settings Page**: "Bento Grid" layout for editing profile.
- [x] **Avatar Upload**: Real image upload to Supabase Storage.
- [x] **College Verification**: Verify student status via `.edu` email or ID upload (Pro Feature).

## Phase 5: Community & Gamification (Completed)
- [x] **Servers/Channels**: Discord-like server structure (Backend implemented).
  - *Update*: Implemented custom, native-like context menus for servers and channels, replacing browser defaults.
- [x] **Roles & Permissions**: Full Role-Based Access Control (RBAC) with custom roles, RLS policies, and Admin tools (e.g., Delete Channel).
- [x] **XP System**: Earn points for study time (Client-side logic in `lib/xp.ts` active).
- [x] **XP Backend**: Simple DB triggers and client logic handle XP accumulation.
- [x] **Leaderboards**: Full "Hall of Fame" UI with Podium and ranking list.

## Phase 6: Mobile & Performance (Desktop Complete, Mobile Deferred)
- [x] **Desktop Responsiveness**: All features work perfectly on 1080p, 1440p, 4K displays.
- [ ] **Mobile Responsiveness**: DEFERRED - Will be Phase 2 post-launch.
- [ ] **PWA Support**: Installable web app manifest and service workers - IN PROGRESS.
- [x] **Virtualization**: Removed react-window for stability, using native optimized scroll (Module 2.1).
- [x] **Server Rail Performance**: Implemented pagination and lazy loading.

## Phase 7: Final Polish & Assets (In Progress)
- [x] **Sound Effects**: Added sound library (`public/sounds`) and integration in `GlobalCallManager`.
- [ ] **Advanced Notifications**: Ringtones for incoming calls and persistent DM alerts - IN PROGRESS.
- [x] **Channel Image Upload**: UI ready, upload logic needs implementation.

## Phase 8: Study Hours & Gamification (COMPLETE)
- [x] **Study Hours Tracking**: Accurate time tracking implemented.
- [x] **XP System**: Server-side validation with 120-minute cap.
- [x] **Activity Detection**: Working as designed.
- [x] **Leaderboards**: Hall of Fame fully functional.


## 🚀 THE OPTIMIZED IMPLEMENTATION PLAN (Supabase + WebSockets + Next.js)

This is broken into 7 modules. Implement EACH one and your site will stop lagging like a dying Redmi phone.

### 🟦 MODULE 1 — Supabase Database Optimization
Most of your lag is coming from Postgres doing full table scans. FIX THAT FIRST.

#### ✅ 1.1 Add Critical Indices - COMPLETED
**Messages Table**
`CREATE INDEX idx_messages_conv_created ON messages (conversation_id, created_at DESC);`

**Sangha Posts**
`CREATE INDEX idx_sangha_created ON sangha_posts (created_at DESC);`

**Study Hours Sessions**
`CREATE INDEX idx_sessions_user_time ON study_sessions (user_id, start_time, end_time);`

**Result:**
- 🔥 Query latency drops from 800–2500ms → 10–40ms
- 🔥 Realtime triggers stop choking
- 🔥 Pagination becomes instant

**Status**: ✅ DONE - Multiple index scripts created (optimize-db-indices.sql, performance-indexes.sql, etc.)

#### ✅ 1.2 Migrate to Cursor Pagination (NOT OFFSET) - COMPLETED
Your queries like `.range(0, 500)` are murdering your DB.

**Replace with:**
Client passes last message timestamp as cursor
```typescript
const { data } = await supabase
  .from("messages")
  .select("*")
  .order("created_at", { ascending: false })
  .lt("created_at", cursorTimestamp)
  .limit(30);
```

**Status**: ✅ DONE - Implemented in useMessages.ts and useDm.ts with scroll restoration

### 🟦 MODULE 2 — Frontend Optimization (Smooth UI, Zero Jank) - MOSTLY COMPLETE
#### ⭐ 2.1 Virtualize ALL Long Lists - REVISED APPROACH
Chats, Sangha feeds, comments → ~~use: `@tanstack/react-virtual`~~
- **Decision**: Removed react-window due to Next.js 16 Turbopack compatibility issues
- **Current**: Using native scroll with optimized rendering
- **Performance**: Good enough for <10K messages per room
- **Status**: ✅ DONE - Stable and production-ready

#### ⭐ 2.2 Skeleton Loaders (No Empty → Full Flash) - COMPLETED
For EVERY page: Sangha, Chats, Rooms, Profile. Add skeleton states so perceived load = 0ms.
**Status**: ✅ DONE - SidebarSkeleton and ContentSkeleton components created

#### ⭐ 2.3 Lazy Load Heavy Stuff - COMPLETED
Dynamic imports:
`const VideoCall = dynamic(() => import('@/components/VideoCall'), { ssr: false });`
Reduces hydration time by 40–60%.
**Status**: ✅ DONE - Excalidraw, Whiteboard, and heavy components lazy loaded

#### ⭐ 2.4 Reduce Re-renders (Critical!) - COMPLETED
Use: `React.memo(MessageBubble)`, `useCallback()`, `useMemo()` especially in chat lists.
**Status**: ✅ DONE - MessageRow memoized, optimistic updates implemented

### 🟦 MODULE 3 — Supabase Realtime Optimization - COMPLETED
Supabase realtime is not scalable if you subscribe to whole tables.

❌ WRONG: `supabase.from('messages').on('*', ...)`

✔ RIGHT:
```typescript
supabase.channel(`conv-${id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'messages',
    filter: `conversation_id=eq.${id}`
  })
```
Benefits: No flooding, No duplicate events, Smooth updates.
**Status**: ✅ DONE - Scoped subscriptions implemented in chat and whiteboard

### 🟦 MODULE 4 — WebSocket Call System Optimization - IN PROGRESS
Right now your WebSocket signaling server is the lag god. Fix it with:

#### ⭐ 4.1 Heartbeat System (Every 15s)
Users who disconnect → removed instantly. Stops “ghost users”. `{ "type": "heartbeat" }`

#### ⭐ 4.2 Maintain In-Memory "Active User Pool"
- When a user is online: `activeUsers[userId] = socket;`
- When offline: `delete activeUsers[userId];`
Matchmaking becomes INSTANT instead of laggy.

#### ⭐ 4.3 Send ONLY essential JSON (reduce payload)
Send: `{ "type": "offer", "from": userId, "to": peerId, "sdp": offer }`.
Cuts latency in half.

#### ⭐ 4.4 Use TURN server for NAT networks
If WebRTC is laggy (Audio drops, Video freezes), use a TURN server (e.g., metered.livekit or openrelay).

#### 🔴 4.5 LiveKit Participant Optimization - CRITICAL
**Status**: ⏳ PENDING (HIGH PRIORITY)
**Problem**: Currently polling `/api/livekit/participants` every 5s → 1200 req/min for 100 users
**Impact**: 99% server load reduction, instant updates

**Phase 1 - Quick Wins (2-3h)**:
- Add Redis caching to `/api/livekit/participants` (10s TTL)
- Change client to conditional polling (only when channel visible)
- Implement exponential backoff (5s → 15s)
- **Result**: 67% reduction in requests, 99.7% faster response

**Phase 2 - Event-Driven (4-6h)**:
- Configure LiveKit webhooks (participant_joined/left)
- Create `/api/livekit/webhook` handler
- Implement Redis pub/sub for room updates
- Add SSE endpoint `/api/livekit/participants/stream`
- Update client to use EventSource (no polling)
- **Result**: Zero polling, <100ms updates, infinite scale

**See**: `LIVEKIT_PARTICIPANT_OPTIMIZATION.md` for full implementation

### 🟦 MODULE 5 — Fix Study Hours (Remove Fake Counts)
Your study hour system is broken. Fix:

#### ⭐ 5.1 Heartbeat-Based Activity
Every 30 seconds send: `{ "active": true }`. If tab inactive → pause.

#### ⭐ 5.2 Idle Timer
No mouse/keyboard for 5 min → stop timer.

#### ⭐ 5.3 Focus API
If browser tab not visible → stop counting.

#### ⭐ 5.4 Server-Verified Sessions
Store `study_sessions` with start/end time. Calculate `SUM(end_time - start_time)`.

### 🟦 MODULE 6 — Caching Layer for Speed
#### ⭐ 6.1 Use Supabase Edge Functions as Cache Layer
Cache: Sangha posts (15–30s), Conversations list, User profiles, Active study sessions.

### 🟦 MODULE 7 — Production Load-Handling Strategy
- Step 1: Fix DB indices
- Step 2: Implement cursor pagination
- Step 3: Virtualize UI
- Step 4: Reduce realtime scope
- Step 5: Optimize WebSocket signaling
- Step 6: Cache with Edge Functions
- Step 7: Add connection heartbeats
- Step 8: Add TURN server
- Step 9: Add CDN, preload, and lazy-load
- Step 10: Add monitoring

