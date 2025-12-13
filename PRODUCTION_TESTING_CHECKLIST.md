# 🧪 Production Testing Checklist

**Deployment:** Vercel  
**Environment:** Production  
**Date:** Dec 13, 2025

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Environment Variables (Vercel Dashboard)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set
- [ ] `NEXT_PUBLIC_LIVEKIT_URL` - Set
- [ ] `LIVEKIT_API_KEY` - Set
- [ ] `LIVEKIT_API_SECRET` - Set
- [ ] `UPSTASH_REDIS_REST_URL` - Set
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Set
- [ ] `MATCHMAKING_SERVER_URL` - Set (Render.com URL)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Set (optional for now)

### Supabase Configuration
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Database migrations applied (`add-role-badges.sql`)
- [ ] Storage buckets public policy set
- [ ] Realtime enabled for tables

### LiveKit Configuration  
- [ ] Webhook URL set: `https://your-domain.vercel.app/api/livekit/webhook`
- [ ] Events enabled: `participant_joined`, `participant_left`
- [ ] API keys match environment variables

### Matchmaking Server (Render.com)
- [ ] Server running (check Render dashboard)
- [ ] Health endpoint responding: `GET /health`
- [ ] WebSocket endpoint open: `wss://your-render-url/`

---

## 🧪 FUNCTIONAL TESTING (30-45 minutes)

### 1. Authentication (5 min)
- [ ] **Sign Up**
  - Go to `/auth/login`
  - Create new account with email
  - Verify email sent
  - Confirm account via email link
  
- [ ] **Sign In**
  - Log in with created account
  - Redirects to `/sangha`
  
- [ ] **Sign Out**
  - Click profile → Sign out
  - Redirects to login
  
- [ ] **Password Reset**
  - Click "Forgot Password"
  - Receive reset email
  - Reset password successfully

**✅ Pass Criteria:** All auth flows work, no console errors

---

### 2. Room Management (5 min)
- [ ] **Create Room**
  - Click "Create Server"
  - Fill name, description
  - Upload icon (optional)
  - Room created successfully
  
- [ ] **Join Room**
  - Click existing room
  - Redirects to `/sangha/rooms/[id]`
  - Chat loads
  
- [ ] **Server Settings** (Admin only)
  - Click gear icon
  - Settings modal opens
  - Create new role
  - Assign icon to role (shield, crown, etc.)
  - Save changes → Success toast

**✅ Pass Criteria:** CRUD operations work, no database errors

---

### 3. Voice Channels (10 min) - **CRITICAL TEST**

#### Test A: Join Voice Channel (Single User)
1. [ ] Click "Study Lounge" voice channel
2. [ ] Browser asks for mic/camera permission → Allow
3. [ ] Token generated successfully (check Network tab)
4. [ ] Connected to LiveKit room
5. [ ] Your username appears in sidebar under "Study Lounge" within **2 seconds**
6. [ ] Green mic indicator shows you're connected

#### Test B: Multi-User Voice (2 Users)
1. [ ] Open incognito window → Log in as different user
2. [ ] Both users join same voice channel
3. [ ] **Both users see each other in sidebar** (real-time update)
4. [ ] Participant count shows "2"
5. [ ] Video tiles display both users
6. [ ] Audio works both ways

#### Test C: Redis Real-Time Update
1. [ ] User A in channel
2. [ ] User B joins
3. [ ] User A sees User B appear **within 2 seconds** (no refresh needed)
4. [ ] User B leaves
5. [ ] User A sees User B disappear **within 2 seconds**

**✅ Pass Criteria:** 
- Participants update in < 2s
- No "Connecting..." stuck state
- No console errors related to LiveKit/Redis

**❌ Fail Signs:**
- Participants don't show up
- Need to refresh to see updates
- Token generation fails (401/403 errors)

---

### 4. Rate Limiting (5 min)

#### Test A: LiveKit Token Rate Limit
1. [ ] Open DevTools → Console
2. [ ] Run this 21 times rapidly:
```javascript
for(let i=0; i<21; i++) {
  fetch('/api/livekit/token?room=test&username=test').then(r => r.status).then(console.log)
}
```
3. [ ] First 20 requests → `200 OK`
4. [ ] 21st request → `429 Too Many Requests`

#### Test B: Matchmaking Rate Limit
1. [ ] Go to `/chat` (matchmaking page)
2. [ ] Click "Find Study Partner" 6 times rapidly
3. [ ] 6th click → Error toast: "Too many attempts. Please wait."

**✅ Pass Criteria:** Rate limits trigger correctly, prevent abuse

---

### 5. Chat & Messages (5 min)
- [ ] **Send Messages**
  - Type message → Send
  - Message appears immediately
  - Other user sees message (realtime)
  
- [ ] **GIF Integration**
  - Click GIF button
  - Search for GIF
  - GIF inserts and displays
  
- [ ] **File Upload**
  - Click attach file
  - Upload image
  - Image displays in chat
  
- [ ] **Scroll Performance**
  - Load 50+ messages
  - Scroll smoothly (no lag)

**✅ Pass Criteria:** Real-time chat works, no message loss

---

### 6. Matchmaking (Video Call) (10 min)
- [ ] Navigate to `/chat`
- [ ] Click "Find Study Partner"
- [ ] Searching animation shows
- [ ] Match found notification
- [ ] Video call establishes
- [ ] Both cameras visible
- [ ] Audio works
- [ ] Skip partner works
- [ ] End call disconnects properly

**✅ Pass Criteria:** WebRTC connection establishes, no infinite searching

---

### 7. Role Badges (5 min)
- [ ] Go to Server Settings → Roles
- [ ] Select a role (e.g., "Admin")
- [ ] Scroll to "Role Icon" section
- [ ] Click shield icon → Selected (orange border)
- [ ] Save changes
- [ ] Go to server member list
- [ ] Member with "Admin" role shows shield icon ✅

**✅ Pass Criteria:** Icons save and display correctly

---

### 8. Error Tracking (If Sentry Configured)
- [ ] Sentry DSN added to Vercel
- [ ] Trigger test error (e.g., navigate to `/nonexistent-page`)
- [ ] Error appears in Sentry dashboard within 1 minute

**✅ Pass Criteria:** Errors captured in Sentry

---

## ⚡ PERFORMANCE TESTING (10 min)

### Lighthouse Test (Chrome DevTools)
1. [ ] Open DevTools → Lighthouse tab
2. [ ] Select "Performance" + "Desktop"
3. [ ] Run audit on `/sangha` page

**Target Scores:**
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

### Redis Usage Check
1. [ ] Go to Upstash dashboard → Your Redis instance
2. [ ] Check "Commands/day" metric
3. [ ] Should be < 5,000 commands/day (50% of free tier)

**✅ Pass Criteria:** Lighthouse green, Redis usage safe

---

## 🚨 CRITICAL BUGS TO WATCH

### High Severity
- [ ] Users can't join voice channels (Token error)
- [ ] Participants don't show up (Redis/Webhook issue)
- [ ] Rate limiting not working (Redis connection issue)
- [ ] Database queries fail (RLS policy problem)

### Medium Severity
- [ ] Slow message loading (> 3 seconds)
- [ ] WebSocket disconnects frequently
- [ ] GIF search broken
- [ ] File uploads fail

### Low Severity
- [ ] UI glitches on mobile
- [ ] Tooltip positioning off
- [ ] Loading skeleton flashes

---

## 📊 METRICS TO MONITOR

### Day 1 (After Launch)
- Total users signed up
- Voice calls initiated
- Average session duration
- Error rate in Sentry

### Week 1
- Daily active users (DAU)
- Redis commands/day
- Supabase database size
- Vercel bandwidth usage

---

## ✅ FINAL GO/NO-GO DECISION

### ✅ GO if:
- [x] All authentication flows work
- [x] Voice channels connect successfully
- [x] Participants display real-time
- [x] Rate limiting active
- [x] No critical console errors

### ❌ NO-GO if:
- [ ] Voice channels broken
- [ ] Redis not connected
- [ ] Database errors
- [ ] >50% features broken

---

**Testing Time:** ~60 minutes  
**Required:** 2 users (you + incognito/friend)

**Next Step:** Test everything above, report issues!
