# 🚀 GURUKUL V2 ROADMAP

**Created:** 2025-12-14
**V1 Status:** ✅ Deployed
**V2 Target:** Q1 2026

---

## 📋 V2 PRIORITIES

### 🔴 HIGH PRIORITY (Do First)

#### 1. Message Threading
> Allow replies to form conversation threads (Slack/Discord style)

**Why:** Reduces chat clutter, improves context in busy rooms

**Implementation:**
- Add `parent_id` to `room_messages` and `dm_messages`
- Create thread view component
- Collapse/expand thread UI
- Thread notification system

**Effort:** 2-3 days

---

#### 2. Voice Messages
> Record and send audio messages

**Why:** Faster than typing, more personal

**Implementation:**
```typescript
// MediaRecorder API
const mediaRecorder = new MediaRecorder(stream)
mediaRecorder.ondataavailable = (e) => uploadAudio(e.data)
```

**Components:**
- Recording button with hold-to-record
- Audio player in chat bubble
- Waveform visualization
- Upload to Supabase Storage

**Effort:** 2 days

---

#### 3. Mobile PWA
> Installable app with push notifications

**Why:** 60%+ users on mobile

**Implementation:**
- `manifest.json` complete
- Service worker for offline
- Push notifications via Web Push API
- Responsive fixes for <768px

**Effort:** 3-4 days

---

### 🟡 MEDIUM PRIORITY (Do Second)

#### 4. Offline Mode (IndexedDB)
> Cache messages locally for offline access

**Why:** Poor connectivity users, instant load

**Implementation:**
- IndexedDB wrapper (Dexie.js)
- Sync queue for offline actions
- Conflict resolution strategy
- Background sync

**Effort:** 4-5 days

---

#### 5. Video Recording
> Record short video messages

**Why:** Tutorial clips, quick explanations

**Implementation:**
- MediaRecorder with video
- 60-second limit
- Thumbnail generation
- Upload with progress

**Effort:** 2-3 days

---

#### 6. Full-Text Search
> Search across ALL messages (not just loaded)

**Why:** Find old conversations

**Implementation:**
```sql
-- Supabase pg_search extension
ALTER TABLE dm_messages ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX dm_messages_fts ON dm_messages USING gin(fts);
```

**API:**
```typescript
const { data } = await supabase
  .from('dm_messages')
  .select('*')
  .textSearch('fts', searchQuery)
```

**Effort:** 1-2 days

---

#### 7. Message Bookmarks
> Save important messages for later

**Why:** Quick reference, study notes

**Implementation:**
- `user_bookmarks` table
- Bookmark button on messages
- Bookmarks page/sidebar
- Categories/tags

**Effort:** 1-2 days

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 8. Message Forwarding
> Forward messages to other chats

**Effort:** 1 day

#### 9. Scheduled Messages
> Send messages at a specific time

**Effort:** 2 days

#### 10. Custom Emoji/Stickers
> Upload custom emojis for servers

**Effort:** 2-3 days

#### 11. A/B Testing Framework
> Test UI variations

**Effort:** 2 days

#### 12. Analytics Dashboard (User-Facing)
> Personal study analytics

**Effort:** 2-3 days

---

## 📊 INFRASTRUCTURE UPGRADES

### Database
- [ ] Read replicas for scale
- [ ] Connection pooler (PgBouncer)
- [ ] Query optimization audit

### Caching
- [ ] Redis for session cache
- [ ] CDN for static assets
- [ ] Edge caching for API routes

### Monitoring
- [ ] Sentry error tracking (✅ Configured)
- [ ] Performance dashboards
- [ ] Alerting for anomalies

---

## 🎯 V2 SPRINT PLAN

### Sprint 1 (Week 1-2): Core Features
- [ ] Message Threading
- [ ] Voice Messages
- [ ] Mobile Responsive Fixes

### Sprint 2 (Week 3-4): PWA & Offline
- [ ] PWA manifest & service worker
- [ ] Push notifications
- [ ] IndexedDB caching

### Sprint 3 (Week 5-6): Search & Polish
- [ ] Full-text search
- [ ] Video recording
- [ ] Message bookmarks

### Sprint 4 (Week 7-8): Scale & Test
- [ ] Load testing (k6)
- [ ] Performance optimization
- [ ] User feedback integration

---

## 📝 V2 DATABASE MIGRATIONS

```sql
-- 1. Threading
ALTER TABLE room_messages ADD COLUMN parent_id UUID REFERENCES room_messages(id);
ALTER TABLE dm_messages ADD COLUMN parent_id UUID REFERENCES dm_messages(id);

-- 2. Bookmarks
CREATE TABLE user_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL, -- 'dm' or 'room'
    message_id UUID NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Full-text search
ALTER TABLE dm_messages ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
ALTER TABLE room_messages ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX dm_messages_fts ON dm_messages USING gin(fts);
CREATE INDEX room_messages_fts ON room_messages USING gin(fts);

-- 4. Scheduled Messages
CREATE TABLE scheduled_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conversation_id UUID,
    room_id UUID,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔒 V2 SECURITY CHECKLIST

- [ ] API key rotation implemented
- [ ] Rate limiting on all endpoints
- [ ] CSRF protection applied everywhere
- [ ] Input sanitization audit
- [ ] XSS prevention review
- [ ] Dependency vulnerability scan

---

## 📱 V2 MOBILE FIXES NEEDED

| Issue | Screen | Priority |
|-------|--------|----------|
| Sidebar overflow | <640px | High |
| Chat input keyboard | iOS Safari | High |
| Video call controls | Mobile | Medium |
| Touch gestures | Swipe actions | Medium |
| Bottom nav | Mobile layout | Low |

---

## 🎨 V2 UI/UX IMPROVEMENTS

1. **Onboarding Flow** - First-time user tutorial
2. **Keyboard Shortcuts** - Power user productivity
3. **Theme Customization** - User color preferences
4. **Notification Center** - Unified notification hub
5. **Quick Actions** - Command palette (Cmd+K)

---

## 📈 SUCCESS METRICS

| Metric | V1 Baseline | V2 Target |
|--------|-------------|-----------|
| DAU | TBD | 1,000+ |
| Avg Session | TBD | 15+ min |
| Messages/Day | TBD | 10k+ |
| Voice Minutes | TBD | 500+ |
| Retention (D7) | TBD | 40%+ |

---

## 🚀 LET'S BUILD V2!

**Next Step:** Choose Sprint 1 features to start with.

Options:
1. **Threading** - Complex but high value
2. **Voice Messages** - Quick win, user visible
3. **Mobile PWA** - Reach more users
4. **Full-Text Search** - Quick backend work

What do you want to tackle first?
