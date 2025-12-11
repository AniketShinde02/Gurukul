# Gurukul Architecture Audit & Improvement Plan

**Date:** December 11, 2025  
**Auditor:** Antigravity (Senior Full-Stack Architect)  
**Status:** DRAFT -> ACTIONABLE  

---

## 1. Executive Summary

The Gurukul platform has a solid foundation but currently suffers from N+1 query patterns, lack of database indexing, and potential scalability bottlenecks in the realtime matchmaking and messaging systems. The following audit identifies critical areas for improvement to support 10k+ concurrent users and provides specific, code-level fixes.

---

## 2. Critical Bottlenecks & Fixes (Phase 1)

### A. Matchmaking Architecture (1:1 Omegle Style)
**Current State:**  
- Linearly scans `waiting_queue`.
- Susceptible to race conditions (two users matching with the same person).
- Polling or simple fetching which is slow at scale.

**Fix Strategy:**
- **Atomic Database Function:** Move the matching logic into a PostgreSQL function (`match_and_update_atomic`) to lock rows and ensure unique matches.
- **Indexing:** Add index on `waiting_queue(joined_at ASC)` for O(1) retrieval of the next partner.
- **Realtime:** Use Supabase Realtime (Channels) solely for notification, not for state management.

### B. Messaging N+1 & Latency
**Current State:**  
- `/api/dm/start` fetches all connections and filters in-memory (O(N)).
- Message lists are not effectively paginated or indexed.

**Fix Strategy:**
- **Direct Query:** Modify `start/route.ts` to query *specific* connection status.
- **Indexes:** Add composite indexes on `messages(room_id, created_at)` and `dm_messages(conversation_id, created_at)`.
- **Optimistic UI:** Ensure client immediately shows message before server confirmation.

### C. File Uploads
**Current State:**  
- Uses Google Drive API via Next.js server (streaming files through the server).
- **Risk:** Server timeout on large files, high memory usage (buffering).

**Fix Strategy:**
- **Supabase Storage:** Switch to direct-to-bucket uploads using Presigned URLs. The server only generates the URL; the client uploads directly to storage.
- **Benefit:** Zero server load for uploads.

---

## 3. Sangha Community Optimization

### A. Data Fetching
**Problem:** `FriendsView.tsx` fetches all friends at once.
**Fix:** 
- Implement **cursor-based pagination** for the friends list.
- Use `useSWR` or `React Query` for caching and background revalidation.

### B. Render Performance
**Problem:** Large lists of friends/messages cause DOM thrashing.
**Fix:**
- Use `react-window` or `virtua` for virtualizing the friend list and message history.
- Verify `key` props are stable (IDs, not indexes).

---

## 4. Backend Scalability Plan

### Rate Limiting
- Implement `upstash/ratelimit` (Redis) on all write endpoints (`/api/dm/send`, `/api/matching/join`).
- **Limit:** 10 requests/10s for messages, 5 joins/min for queues.

### Caching
- **Profile Data:** Cache public profiles in Redis or use Supabase CDN for avatars.
- **Static Assets:** Ensure Next.js `Image` component is correctly configured with `sharp`.

---

## 5. UI/UX "Premium" Upgrades

- **Skeleton Loading:** Replace spinning loaders with Skeleton frames that match the layout.
- **Toast Notifications:** Standardize on `sonner` or `react-hot-toast` with a custom dark-mode theme.
- **Glassmorphism:** Enforce consistent `backdrop-blur-xl`, `bg-black/40`, and thin `border-white/10` borders.

---

## 6. Deployment Hardening

- **Middleware:** Remove database calls from `middleware.ts` to reduce edge latency.
- **Environment:** Separate `NEXT_PUBLIC_API_URL` for dev/staging/prod.
- **Monitoring:** Add Sentry for error tracking.

---

## 7. Action Plan (Next Steps)

1. **Apply Phase 1 "Exact Fixes"** (API Routes & SQL) [IN PROGRESS]
2. **Run SQL Migration** to create necessary indexes and functions.
3. **Refactor Sangha Clients** to use new API structures.
4. **Stress Test** using `k6` or `autocannon` to verify 100ms response times.
