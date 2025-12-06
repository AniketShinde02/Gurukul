# Quick Fix Guide - Critical Performance Issues

## 🚀 Immediate Actions (Do These First)

### 1. Add Database Indexes (5 minutes)

Run this SQL in your Supabase SQL Editor:

```sql
-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message 
ON dm_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1_archived 
ON dm_conversations(user1_id, archived_by_user1);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2_archived 
ON dm_conversations(user2_id, archived_by_user2);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation_created 
ON dm_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_messages_sender 
ON dm_messages(sender_id);

-- Room channels indexes
CREATE INDEX IF NOT EXISTS idx_room_channels_room 
ON room_channels(room_id, position);

-- Messages indexes for rooms
CREATE INDEX IF NOT EXISTS idx_messages_session_created 
ON messages(session_id, created_at DESC);

-- Analyze tables for query optimization
ANALYZE dm_conversations;
ANALYZE dm_messages;
ANALYZE messages;
```

**Expected Impact**: 10-50x faster queries immediately

---

### 2. Add Pagination to Conversations (15 minutes)

**File**: `app/api/dm/conversations/route.ts`

Add after line 32:

```typescript
// Get pagination params
const url = new URL(request.url)
const page = parseInt(url.searchParams.get('page') || '0')
const limit = parseInt(url.searchParams.get('limit') || '50')
const offset = page * limit
```

Update the query (line 44):

```typescript
.order('last_message_at', { ascending: false, nullsFirst: false })
.range(offset, offset + limit - 1) // Add this line
```

---

### 3. Limit Messages by Default (10 minutes)

**File**: `app/api/dm/conversations/[id]/messages/route.ts`

Add pagination:

```typescript
// Add after getting conversationId
const limit = 50 // Last 50 messages

// Update the query
.order('created_at', { ascending: false }) // Changed to DESC
.limit(limit)
```

Then reverse the array before sending:

```typescript
return NextResponse.json({ 
    messages: (data || []).reverse() // Newest at bottom
})
```

---

### 4. Add Message Virtualization (30 minutes)

Install react-window:

```bash
npm install react-window @types/react-window
```

**File**: `components/sangha/ChatArea.tsx`

Replace the messages map with:

```typescript
import { FixedSizeList as List } from 'react-window'

// In the messages area:
<List
    height={600}
    itemCount={messages.length}
    itemSize={100}
    width="100%"
>
    {({ index, style }) => (
        <div style={style}>
            {/* Your message component */}
        </div>
    )}
</List>
```

---

## 📊 Testing After Fixes

Run these tests to verify improvements:

```javascript
// Test 1: Check query performance
console.time('fetch-conversations')
const res = await fetch('/api/dm/conversations')
console.timeEnd('fetch-conversations')
// Should be <500ms

// Test 2: Check message load time
console.time('fetch-messages')
const res = await fetch('/api/dm/conversations/[id]/messages')
console.timeEnd('fetch-messages')
// Should be <300ms

// Test 3: Check render performance
console.time('render-messages')
// Open a chat with 50+ messages
console.timeEnd('render-messages')
// Should be <100ms
```

---

## 🎯 Success Metrics

| Metric | Before | Target After Fix |
|--------|--------|------------------|
| Conversation load time | 2-5s | <500ms |
| Message load time | 1-3s | <300ms |
| Scroll performance | Laggy | Smooth 60fps |
| Memory usage | 200MB+ | <100MB |
| Database CPU | 80%+ | <20% |

---

## ⚠️ Breaking Changes

**Pagination**: Frontend needs to handle paginated responses

```typescript
// Update useDm.ts
const fetchConversations = async (page = 0) => {
    const res = await fetch(`/api/dm/conversations?page=${page}&limit=50`)
    // Handle pagination
}
```

**Message Order**: Messages now come newest-first from API

```typescript
// Already reversed in API, no frontend change needed
```

---

## 🔄 Rollback Plan

If something breaks:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_dm_conversations_last_message;
DROP INDEX IF EXISTS idx_dm_messages_conversation_created;
-- etc.
```

```bash
# Revert code changes
git checkout HEAD -- app/api/dm/conversations/route.ts
git checkout HEAD -- app/api/dm/conversations/[id]/messages/route.ts
```

---

## 📈 Next Steps After Quick Fixes

1. Implement infinite scroll for messages
2. Add React Query for caching
3. Optimize real-time subscriptions
4. Add rate limiting
5. Implement file upload chunking

See `PERFORMANCE_BOTTLENECKS.md` for full details.
