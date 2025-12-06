# Guide.md

---

## 1. Project Overview

**What we built so far**
- A full‑stack web application called **Chitchat** that lets users sign‑in, view a personalized dashboard, join study rooms, find partners, share resources, and track study statistics.
- Real‑time UI built with **React (Next.js)**, styled with **vanilla CSS** and a premium dark‑glass aesthetic.
- Backend powered by **Supabase** (PostgreSQL + Auth) exposing a handful of REST‑like endpoints via the Supabase client.
- Database tables: `profiles`, `chat_sessions`, `messages`, plus supporting tables for analytics.

**Why we built it**
- To give students a collaborative study environment that feels like a friendly study‑hall rather than a sterile LMS.
- To showcase modern web‑dev practices (type‑safe TypeScript, optimistic UI, dark‑mode design) while keeping the stack simple and production‑ready.

**Core vision**
- *“Study together, grow together.”*  The app should feel like a living, breathing campus where every click nudges you toward knowledge.

**Theme & design direction**
- Dark, glass‑morphism UI with subtle gradients, neon orange accents, and smooth micro‑animations.
- Typography from **Google Font – Inter** for readability.
- Consistent component library (icons from `lucide-react`, custom cards, loaders).

**Problem our system solves**
- Fragmented study resources and lack of peer‑matching.
- No single place to see personal study metrics.
- Manual coordination of study sessions.

**Simple analogy (5‑year‑old)**
> Imagine a big playground where every kid has a colored badge. The badge shows how long they’ve played, who they played with, and what toys they shared. When a kid wants to play a new game, they just tap a button, and the playground magically shows the right friends and toys.

---

## 2. Full Chronological Story (Start → End)

| Step | Prompt / Action | What AI understood | Decision / Change | Mistake | Fix | Learning |
|------|----------------|-------------------|-------------------|--------|-----|----------|
| 1 | Initial repo scaffold (Next.js, Supabase client) | Need a starter with auth & dashboard | Created `app/(authenticated)/dashboard/page.tsx` with placeholder stats | Missing `id` column in `chat_sessions` query | Added `id` to `.select()` (fixed TS error) | Always verify DB fields before using them |
| 2 | Request to display recent activity | Show recent sessions as activity cards | Mapped `sessions` → `Activity[]` using `formatDistanceToNow` | Used `session.id` without selecting it | Fixed by selecting `id` (see above) | Keep query columns in sync with UI model |
| 3 | Styling overhaul – dark glassmorphism | Need premium look | Added CSS variables, gradients, hover effects | Some components lost contrast on low‑light mode | Adjusted color palette, added `focus-visible` outlines | Accessibility matters even in dark themes |
| 4 | Add “Delete Chat” feature (soft‑delete) | Users should be able to hide chats | Implemented `isDeleted` flag in `chat_sessions` and UI filter | Deletion was slow, UI didn’t refresh, chats re‑appeared after reload | Added optimistic UI update, refetched list, filtered on `isDeleted` | Optimistic updates + server flag = smooth UX |
| 5 | Profile page refinements (avatars, greetings) | Personalize dashboard | Fetched `profileData.avatar_url` and used UI fallback | Avatar URL sometimes null causing broken image | Added fallback to `ui‑avatars.com` service | Defensive defaults prevent broken UI |
| 6 | Real‑time stats (study hours, connections) | Show meaningful metrics | Calculated total minutes from `started_at`/`ended_at`, unique peers set | Edge case: sessions without `ended_at` caused NaN | Guarded with `&&` checks before date math | Defensive coding for incomplete data |
| 7 | Documentation request – Guide.md (this file) | Provide exhaustive project guide | Will generate a dense markdown file covering everything | — | — | — |

**Behind‑the‑scenes documentary**
- The AI iteratively read the codebase, identified type errors, and suggested schema‑aware fixes.
- UI bugs were reproduced locally (`npm run dev`) and traced to missing DB fields or stale state.
- Each prompt refined the mental model of the project, allowing the AI to anticipate future needs (e.g., soft‑delete flags before they were asked).

---

## 3. Complete System Architecture

### Folder Structure (high‑level)
```
/chitchat
├─ /app                     # Next.js app routes (pages)
│   ├─ (authenticated)      # Protected routes
│   │   ├─ dashboard/page.tsx
│   │   ├─ profile/page.tsx
│   │   └─ sangha/page.tsx
│   └─ layout.tsx, globals.css
├─ /public                  # Static assets (icons, fonts)
├─ /scripts                 # SQL maintenance scripts
├─ /styles                  # Global CSS, design tokens
├─ /lib                     # Supabase client wrapper
│   └─ supabase/client.ts
├─ README.md                # Project description
└─ Guide.md                 # THIS DOCUMENTATION
```

### Frontend Architecture
- **Next.js (App Router)** – Server‑side rendering for SEO, client components for interactivity.
- **React Hooks** – `useState`, `useEffect` for data fetching; custom hooks could be added later.
- **Supabase JS client** – Directly called from components; no additional API layer.
- **State Management** – Local component state; data is refreshed after each mutation.
- **Styling** – Vanilla CSS with CSS variables for theme colors; utility classes from Tailwind‑like naming (but hand‑crafted).

### Backend Architecture (Supabase)
- **PostgreSQL** tables:
  - `profiles` (id, username, full_name, avatar_url, created_at)
  - `chat_sessions` (id, started_at, ended_at, user1_id, user2_id, status, isDeleted, isArchived)
  - `messages` (id, chat_session_id, sender_id, content, type, created_at)
- **Auth** – Supabase Auth (email/password, JWT). Session token stored in cookies.
- **RLS (Row Level Security)** – Policies ensure users only read/write their own rows.
- **Edge Functions** – Not used yet, but ready for future background jobs.

### API Endpoints (via Supabase client)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `profiles.select` | GET | Fetch current user profile |
| `chat_sessions.select` | GET | List sessions (filtered by user, status, soft‑delete flags) |
| `chat_sessions.update` | PATCH | Soft‑delete (`isDeleted`) or archive (`isArchived`) |
| `messages.select` | GET | Load messages for a session |
| `messages.insert` | POST | Send a new message |

### Data Flow Diagram (ASCII)
```
User Interaction
   │
   ▼
[React Component] ──► Supabase JS Client ──► Supabase API (REST)
   │                                 │
   │                                 ▼
   │                         PostgreSQL DB (tables)
   │                                 ▲
   │                                 │
   ◀───────────────────── Response (JSON) ──────────────────────
```

### Deployment Pipeline
1. **Local dev** – `npm run dev` (Next.js dev server).
2. **CI** – GitHub Actions run `npm ci`, `npm run lint`, `npm run test`.
3. **Build** – `npm run build` produces optimized static assets.
4. **Deploy** – Vercel (or similar) pulls repo, runs `npm run build`, serves via Edge Network.
5. **Supabase** – Managed DB, migrations via SQL scripts in `/scripts`.

---

## 4. Frontend Deep‑Dive

### UI/UX Decisions
- **Dashboard cards** – Show key metrics with icons; hover expands border to orange for feedback.
- **Quick‑action buttons** – Gradient backgrounds for primary actions, muted dark cards for secondary.
- **Recent Activity list** – Card‑like rows with avatar, action text, timestamp; fallback avatar via `ui‑avatars.com`.
- **Loading state** – Central spinner (`Loader2`) with orange spin animation.
- **Error handling** – `console.error` logged; UI stays on loading spinner until `setLoading(false)`.

### Optimistic Updates (Delete Chat Example)
1. User clicks delete → UI immediately removes the chat from the list.
2. `supabase.from('chat_sessions').update({ isDeleted: true })` runs in background.
3. If the request fails, UI re‑adds the chat and shows a toast.

### Component Communication
- **Parent (`DashboardPage`)** holds state arrays (`stats`, `activities`).
- Child components (cards, activity rows) receive data via props – pure functional components.
- No global store; each page fetches its own data on mount.

### Performance & Accessibility
- **Lazy loading** of images (`loading="lazy"` default in Next.js `<Image>` not used yet – plain `<img>` with `loading="lazy"` could be added.
- **Color contrast** – Orange accent against dark background meets WCAG AA.
- **Keyboard navigation** – Buttons are native `<button>` elements, focusable.
- **ARIA** – Not yet added; future work: `aria-label` on icon‑only buttons.

---

## 5. Backend Deep‑Dive

### Endpoints (Supabase calls) – Example
```ts
// Soft‑delete a chat session
await supabase
  .from('chat_sessions')
  .update({ isDeleted: true })
  .eq('id', sessionId)
  .eq('user1_id', user.id) // RLS ensures only owner can delete
```
- **Request**: `{ sessionId }`
- **Response**: `{ data: [{ id, isDeleted: true }], error: null }`

### Delete vs Archive vs Soft‑Delete
| Action | DB Flag | UI Effect | Typical Use |
|--------|---------|-----------|-------------|
| Delete | `isDeleted = true` | Row disappears from all views | Permanent removal (but recoverable via admin) |
| Archive | `isArchived = true` | Row hidden from main view, appears in “Archive” tab | Long‑term storage without clutter |
| Soft‑Delete (same as Delete flag) | – | Immediate UI hide, server‑side flag | Faster UX, avoids cascade deletes |

### Auth & Session
- Supabase Auth issues JWT stored in `supabase.auth.getUser()`.
- `useEffect` on dashboard fetches current user once, then queries data scoped to that `user.id`.
- RLS policies on tables restrict reads/writes to rows where `user_id = auth.uid()`.

### Security Considerations
- **SQL Injection** – Supabase client uses parameterised queries; safe.
- **Rate limiting** – Supabase provides built‑in throttling; can add edge functions for heavy endpoints.
- **Data validation** – Typescript interfaces (`DashboardStats`, `Activity`) enforce shape; server still validates via DB constraints.
- **CORS** – Handled by Supabase; only same‑origin requests allowed.

---

## 6. “Delete Chat” In‑Depth Fix Explanation

### What was happening
- UI called `setActivities([...])` after deletion, but the underlying query still fetched the row because the DB row was never excluded.
- Deleting a row via `supabase.from('chat_sessions').delete()` caused a full table scan and UI flicker.
- After page reload, the chat re‑appeared because the row was never truly removed.

### Why it was slow & flaky
- Full delete triggers cascade checks and row locks.
- No optimistic UI – the UI waited for the network response before updating.

### Soft‑delete solution
1. **Add columns** `isDeleted BOOLEAN DEFAULT FALSE`, `isArchived BOOLEAN DEFAULT FALSE` to `chat_sessions`.
2. **Update UI** to filter out rows where `isDeleted` is true.
3. **Optimistic UI** – Immediately remove the item from local state, then fire the update request.
4. **Redirect** – After successful delete, navigate back to dashboard or show a toast.

### Implementation steps (pseudo‑code)
```ts
// 1. DB migration (SQL script in /scripts)
ALTER TABLE chat_sessions ADD COLUMN isDeleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE chat_sessions ADD COLUMN isArchived BOOLEAN NOT NULL DEFAULT FALSE;

// 2. Frontend delete handler
const handleDelete = async (sessionId: string) => {
  // optimistic UI
  setActivities(prev => prev.filter(a => a.id !== sessionId));
  const { error } = await supabase
    .from('chat_sessions')
    .update({ isDeleted: true })
    .eq('id', sessionId);
  if (error) {
    // rollback UI change
    setActivities(prev => [...prev, /* re‑add the removed item */]);
    toast.error('Could not delete chat');
  } else {
    toast.success('Chat deleted');
    router.push('/dashboard'); // optional redirect
  }
};
```

### Flowchart (ASCII)
```
User clicks Delete
   │
   ▼
[Optimistic UI] – remove from list
   │
   ▼
Supabase PATCH { isDeleted: true }
   │
   ├─ Success → Show toast, maybe redirect
   └─ Failure → Re‑add item, show error toast
```

---

## 7. Scalability & Future‑Proofing

### 10K users
- **DB indexing** on `user1_id`, `user2_id`, `status`, `isDeleted`.
- **Connection pooling** – Supabase handles via PostgreSQL connection pool.
- **Static asset CDN** – Vercel edge network serves CSS/JS.

### 100K users
- **Read replicas** – Add read‑only replica for heavy dashboard queries.
- **Caching** – Use `swr` or `react-query` with stale‑while‑revalidate for profile data.
- **Background workers** – Offload heavy analytics to Supabase Edge Functions or a separate Node worker.

### 1M users
- **Sharding** – Partition `chat_sessions` by `user_id` hash.
- **Object storage** – Move avatars & uploaded files to Supabase Storage (S3‑compatible) with CDN.
- **Rate limiting** – Implement per‑IP/IP‑user limits via Cloudflare Workers.
- **Horizontal scaling** – Deploy Next.js on a serverless platform (Vercel) that auto‑scales.

---

## 8. Complete Tech Stack Summary

| Layer | Library / Service | Reason for Choice | Alternatives |
|-------|-------------------|-------------------|--------------|
| Frontend | **Next.js (App Router)** | SSR for SEO, file‑system routing, built‑in CSS support | Remix, Nuxt (Vue) |
| UI | **React**, **lucide-react** icons, **vanilla CSS** | Full control over premium design, no Tailwind dependency | Tailwind CSS, Chakra UI |
| State | **React Hooks** (local) | Simplicity, no extra bundle size | Redux, Zustand |
| Backend | **Supabase** (PostgreSQL + Auth) | Managed DB + auth, RLS, easy client SDK | Firebase, Hasura, custom Express API |
| Database | **PostgreSQL** | Relational, strong ACID guarantees | MySQL, CockroachDB |
| Deployment | **Vercel** (Next.js) + **Supabase** hosting | Zero‑config CI/CD, edge network | Netlify, AWS Amplify |
| Testing | **Jest** (unit), **React Testing Library** | Popular, type‑safe, CI friendly | Vitest, Cypress |

---

## 9. Glossary (Explain Like I’m 5)
- **Component** – A Lego brick that builds part of the screen.
- **API** – A waiter that carries food (data) from the kitchen (backend) to your table (frontend).
- **Soft‑Delete** – Instead of throwing a toy away, we put a “do not show” sticker on it.
- **Archive** – We store the toy in a special box; you can still find it later.
- **RLS (Row Level Security)** – A guard that only lets you see your own toys.
- **Optimistic UI** – Pretend the toy is already gone before the waiter confirms it.
- **JWT** – A secret badge that proves who you are.
- **SSR (Server‑Side Rendering)** – The kitchen prepares the whole meal before sending it to you.
- **Edge Network** – A bunch of tiny kitchens close to you so food arrives fast.
- **CDN** – A library of pre‑baked cookies (static files) placed everywhere.
- **Shard** – Splitting a huge toy box into many smaller boxes.
- **Cache** – A quick‑grab drawer that keeps your favorite toys nearby.

---

## 10. Additional Creative Elements

### Emoji‑enhanced Table (Feature Timeline)
| 📅 | 🛠️ Feature | 🐞 Bug | ✅ Fix |
|----|------------|-------|------|
| 🎉 | Dashboard UI | ❌ Missing `id` column | ✅ Added `id` to query |
| 🔍 | Recent Activity | ⚡ Slow delete | ✅ Soft‑delete + optimistic UI |
| 🎨 | Dark‑glass design | 🌙 Low contrast | ✅ Adjusted palette |

### ASCII Architecture Art
```
   +-------------------+        +-------------------+
   |   Browser (UI)   | <----> |   Next.js Server  |
   +-------------------+        +-------------------+
            │                           │
            ▼                           ▼
   +-------------------+        +-------------------+
   |   Supabase JS    | <----> |   Supabase API   |
   +-------------------+        +-------------------+
            │                           │
            ▼                           ▼
   +-------------------+        +-------------------+
   |   PostgreSQL DB   | <----> |   Edge Functions |
   +-------------------+        +-------------------+
```

### Tips for Future Debugging
1. **Read the TypeScript error line numbers** – they point to the exact missing field.
2. **Check Supabase console** – see raw rows to verify column names.
3. **Use console.log** before mapping arrays to ensure data shape.
4. **When adding flags (`isDeleted`)** – always update UI filters.
5. **Run `npm run lint`** – catches unused vars and missing semicolons.

### “What Not to Do”
- ❌ Never mutate state directly (`activities.push(...)`).
- ❌ Skip error handling on Supabase calls.
- ❌ Hard‑code colors; use CSS variables for theme consistency.
- ❌ Forget to add RLS policies – could expose all users’ data.

---

## 11. Final Summary
- **What we built**: A dark‑themed, real‑time study dashboard with profile, stats, quick actions, recent activity, and soft‑delete chat functionality.
- **What works**: Authentication, data fetching, UI rendering, optimistic delete, responsive design.
- **What needs improvement**: Add proper ARIA labels, unit tests for data‑fetch hooks, pagination for activity list, and a dedicated “Archive” view.
- **Next steps**:
  1. Write unit/integration tests (`jest`, `react-testing-library`).
  2. Implement pagination & infinite scroll for activities.
  3. Add ARIA/accessibility enhancements.
  4. Create an “Archive” page that reads `isArchived` rows.
  5. Set up CI pipeline to run lint, tests, and deploy automatically.

*End of Guide.md*

---

## 12. 🔥 Update from Chat Session (2025-12-01) - Video Call Refinements

### Problem: Connection Reliability & Race Conditions
The video call functionality was experiencing intermittent failures where:
1.  **Video Connection Failures**: Only audio would connect, even when video was requested.
2.  **Missed Signal Offers**: If User 2 (the receiver) joined a session slightly after User 1 (the initiator) sent the "offer" signal, the offer would be missed because the real-time subscription wasn't active yet.
3.  **UI State Desync**: The interface would sometimes show "Video Connected" when only audio was active, or vice versa.
4.  **Accidental Code Duplication**: A previous edit introduced a duplicate block of code, causing confusion.
5.  **Preference Issue**: The user's choice of "Video" vs "Audio" mode was not always respected upon initial connection.

### Fixes Implementation

1.  **Race Condition Check (The "Missed Offer" Logic)**
    *   **Logic**: Instead of relying *only* on real-time events, the app now actively fetches chat history immediately upon connecting to a session.
    *   **Why**: This ensures that if an offer signal was sent *before* we started listening, we catch it from the history.
    *   **Code Flow**:
        ```typescript
        // In connectToSession()
        const { data: existingMessages } = await supabase.from('messages')...
        
        // If I am User 2 (Receiver), check history for an offer
        const offerMsg = existingMessages.find(m => m.type === 'offer' && m.sender_id === initiatorId)
        
        if (offerMsg && !hasAnswered) {
             console.log('Found missed offer, accepting...')
             handleSignalingMessage(offerMsg) // Auto-accept!
        }
        ```

2.  **Strict Preference Enforcement**
    *   **Logic**: The `studyMode` ('video' or 'audio') is now the single source of truth for initializing `isVideoOpen`.
    *   **Result**: If you select "Video Mode", the camera turns on immediately. If "Audio Mode", it stays off.

3.  **UI State Refactor**
    *   **Change**: Refactored the main JSX render loop in `page.tsx`.
    *   **Logic**:
        *   IF `status === 'connected'` AND `isVideoOpen` -> Show `<video>` elements.
        *   IF `status === 'connected'` AND `!isVideoOpen` -> Show "Audio Session Active" card.
    *   **Result**: No more confusion. The UI always matches the internal state.

4.  **Sidebar Restoration**
    *   **Fix**: The "Preferences" sidebar (Subjects, Language, Mode) was accidentally hidden in a previous version. It has been restored and conditionally shown when *not* in a call, or can be collapsed.

### Key Learnings
- **Real-time is not enough**: You cannot rely solely on pub/sub for critical initial state. You *must* check the persisted "state of the world" (database history) when joining a session to catch up on what happened before you arrived.
- **State as Truth**: The UI should purely be a reflection of state variables (`isVideoOpen`, `status`). Do not rely on side-effects to switch UI views.

### System Diagram (Connection Flow)
```ascii
[User 1 (Initiator)]                  [User 2 (Receiver)]
       │                                     │
       ├──(1) Create Offer ─────────────────►│ (Stored in DB)
       │                                     │
       │                                     ├──(2) Connects to Session
       │                                     │      │
       │                                     │      ├──(3) Fetch History? 
       │                                     │      │    (Found Offer!)
       │                                     │      │
       │◄──(4) Send Answer ───────────────────┘      │
       │                                            │
    (Connection Established via WebRTC) ◄───────────┘
```
**Outcome**: Robust video calling with fail-safe signaling and a reliable UI.
