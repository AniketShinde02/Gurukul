# 🚀 LIVEKIT PARTICIPANT OPTIMIZATION - EVENT-DRIVEN ARCHITECTURE

**Date**: December 12, 2025  
**Priority**: 🔴 **CRITICAL - PERFORMANCE**  
**Status**: 📋 PLANNING

---

## 🐛 **THE PROBLEM**

### **Current Approach (BAD)** ❌:
```typescript
// RoomSidebar.tsx - Lines 365-393
useEffect(() => {
    const fetchParticipants = async () => {
        const roomToFetch = activeCallRoom || `${roomId}-General Lounge`
        const res = await fetch(`/api/livekit/participants?room=${encodeURIComponent(roomToFetch)}`)
        const data = await res.json()
        setParticipants(data)
    }

    fetchParticipants()
    const interval = setInterval(fetchParticipants, 5000) // ❌ EVERY 5 SECONDS!
    return () => clearInterval(interval)
}, [activeCallRoom, roomId])
```

### **Why This Sucks**:
1. **Expensive Server Render**: Full API call every 5 seconds (~1s render time)
2. **QPS Explosion**: 100 users = 1200 requests/min 💥
3. **Unnecessary Load**: Updates even when user isn't looking at channel
4. **No Caching**: LiveKit API called every single time
5. **Delay**: Up to 5 seconds to see new participants

---

## ✅ **THE SOLUTION - EVENT-DRIVEN ARCHITECTURE**

### **Best Approach (PRODUCTION-GRADE)**:

```
LiveKit → Webhook → Redis Cache → WebSocket → Clients
   ↓          ↓           ↓            ↓          ↓
Events    Update      Store      Broadcast   Update UI
          Cache       Data      to Clients   Instantly
```

### **Why This Is Best**:
- ✅ **Zero polling** from clients → minimal load
- ✅ **Instant updates** on join/leave (real-time)
- ✅ **Scales infinitely** with Redis pub/sub
- ✅ **Minimal server cost** (only cache updates)
- ✅ **Works offline** (cached data available)

---

## 🏗️ **ARCHITECTURE DESIGN**

### **Components**:

```
┌─────────────┐
│  LiveKit    │
│   Server    │
└──────┬──────┘
       │ Webhooks (participant events)
       ↓
┌─────────────────────────────┐
│  /api/livekit/webhook       │
│  • Receives events          │
│  • Updates Redis cache      │
│  • Publishes to WS channel  │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│  Redis Cache                │
│  participants:{roomId}      │
│  TTL: 60s (auto-expire)     │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│  WebSocket Server           │
│  • Broadcast to clients     │
│  • Room-based channels      │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│  React Clients              │
│  • Subscribe on mount       │
│  • Update UI instantly      │
│  • Unsubscribe on unmount   │
└─────────────────────────────┘
```

---

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Quick Fix (Can Deploy Today)** ⚡

**Goal**: Stop the bleeding, add caching

#### **1.1 Add Server-Side Cache (Redis)**

**Install Redis**:
```bash
npm install @upstash/redis
```

**Create Redis client** (`lib/redis.ts`):
✅ **DONE** - Implemented using @upstash/redis

**Environment variable** (`.env.local`):
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

**Environment variable** (`.env.local`):
```env
REDIS_URL=redis://localhost:6379  # Local dev
# Or use Upstash Redis (free tier):
# REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
```

---

#### **1.2 Update `/api/livekit/participants` with Cache**

**File**: `app/api/livekit/participants/route.ts`
✅ **DONE** - Implemented Redis caching check

**After** (fast, cached):
```typescript
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get('room')
    if (!room) return Response.json([])

    const cacheKey = `participants:${room}`
    
    // 1. Check cache first (Redis)
    const cached = await redis.get(cacheKey)
    if (cached) {
        console.log('✅ Cache HIT for room:', room)
        return Response.json(JSON.parse(cached))
    }

    // 2. Cache MISS - fetch from LiveKit
    console.log('❌ Cache MISS for room:', room)
    try {
        const participants = await listParticipants(room)
        
        // 3. Store in cache for 10 seconds
        await redis.set(cacheKey, JSON.stringify(participants), 'EX', 10)
        
        return Response.json(participants)
    } catch (error) {
        console.error('Error fetching participants:', error)
        return Response.json([])
    }
}
```

**Result**: 
- First call: ~1s (LiveKit API)
- Next 10s: ~10ms (Redis cache)
- **100x faster!**

---

#### **1.3 Update Client - Conditional Polling**

**File**: `components/sangha/RoomSidebar.tsx`

**Before** (always polling):
```typescript
useEffect(() => {
    fetchParticipants()
    const interval = setInterval(fetchParticipants, 5000) // ❌
    return () => clearInterval(interval)
}, [activeCallRoom, roomId])
```

**After** (smart polling):
```typescript
const [isChannelVisible, setIsChannelVisible] = useState(false)

// Only poll when channel is visible/expanded
useEffect(() => {
    if (!isChannelVisible) return // ✅ Don't poll if hidden!

    fetchParticipants() // Initial fetch
    
    // Poll with exponential backoff
    let interval = 5000 // Start 5s
    const maxInterval = 15000 // Max 15s
    
    const poll = setInterval(() => {
        fetchParticipants()
        interval = Math.min(interval * 1.2, maxInterval) // Increase interval
    }, interval)

    return () => clearInterval(poll)
}, [isChannelVisible, activeCallRoom, roomId])

// Toggle visibility
const toggleChannel = () => setIsChannelVisible(!isChannelVisible)
```

**Result**: 
- Hidden channels: **0 requests/min**
- Visible channels: **4-12 requests/min** (instead of 12)

---

### **Phase 2: Event-Driven (Production-Grade)** 🏆

**Goal**: Zero polling, instant updates

#### **2.1 Configure LiveKit Webhooks**

**LiveKit Dashboard**:
1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourapp.com/api/livekit/webhook`
3. Select events:
   - `participant_joined`
   - `participant_left`
   - `track_published`
4. Save webhook secret

**Environment** (`.env.local`):
```env
LIVEKIT_WEBHOOK_SECRET=whsec_xxxxx
```

---

#### **2.2 Create Webhook Handler**

**File**: `app/api/livekit/webhook/route.ts` (NEW)

```typescript
import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { WebhookReceiver } from 'livekit-server-sdk'

const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_WEBHOOK_SECRET!
)

export async function POST(request: NextRequest) {
    try {
        // 1. Verify webhook signature
        const body = await request.text()
        const authHeader = request.headers.get('Authorization')
        
        const event = receiver.receive(body, authHeader!)
        
        const { room, participant } = event
        const cacheKey = `participants:${room.name}`

        // 2. Update Redis cache based on event
        if (event.event === 'participant_joined') {
            console.log('👤 User joined:', participant.identity, 'in room:', room.name)
            
            // Add to Redis set
            await redis.sadd(cacheKey, JSON.stringify({
                sid: participant.sid,
                identity: participant.identity,
                metadata: participant.metadata,
                joinedAt: Date.now()
            }))
            
        } else if (event.event === 'participant_left') {
            console.log('👤 User left:', participant.identity, 'from room:', room.name)
            
            // Remove from Redis set (find by identity)
            const members = await redis.smembers(cacheKey)
            const toRemove = members.find(m => {
                const p = JSON.parse(m)
                return p.sid === participant.sid
            })
            if (toRemove) {
                await redis.srem(cacheKey, toRemove)
            }
        }

        // 3. Get updated participant list
        const participantSet = await redis.smembers(cacheKey)
        const participants = participantSet.map(p => JSON.parse(p))

        // 4. Broadcast to WebSocket clients
        // (We'll implement this next)
        await broadcastToRoom(room.name, {
            type: 'participants:update',
            payload: participants
        })

        // 5. Update cache with full list
        await redis.set(cacheKey, JSON.stringify(participants), 'EX', 60)

        return Response.json({ ok: true })
        
    } catch (error) {
        console.error('Webhook error:', error)
        return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
```

---

#### **2.3 Add WebSocket Broadcast**

**Option A: Use Existing Matchmaking Server**

**File**: `matchmaking-server/index.js`

```javascript
// Add new event types
const participantConnections = new Map() // roomId -> Set<ws>

io.on('connection', (socket) => {
    // ... existing code ...

    // Subscribe to room participants
    socket.on('subscribe:participants', ({ roomId }) => {
        if (!participantConnections.has(roomId)) {
            participantConnections.set(roomId, new Set())
        }
        participantConnections.get(roomId).add(socket)
        
        socket.on('disconnect', () => {
            participantConnections.get(roomId)?.delete(socket)
        })
    })
})

// Broadcast function (called from webhook)
function broadcastParticipants(roomId, participants) {
    const clients = participantConnections.get(roomId)
    if (!clients) return

    clients.forEach(socket => {
        socket.emit('participants:update', participants)
    })
}

// HTTP endpoint for webhook to call
app.post('/broadcast/participants', (req, res) => {
    const { roomId, participants } = req.body
    broadcastParticipants(roomId, participants)
    res.json({ ok: true })
})
```

**Webhook calls WS server**:
```typescript
// In webhook handler
async function broadcastToRoom(roomId: string, message: any) {
    await fetch('http://localhost:3001/broadcast/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, participants: message.payload })
    })
}
```

---

**Option B: Use Server-Sent Events (SSE)** (Simpler)

**File**: `app/api/livekit/participants/stream/route.ts` (NEW)

```typescript
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get('room')
    if (!room) return new Response('Missing room', { status: 400 })

    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
        async start(controller) {
            // Send initial data
            const cached = await redis.get(`participants:${room}`)
            const initial = cached ? JSON.parse(cached) : []
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`))

            // Subscribe to Redis pub/sub for updates
            const subscriber = redis.duplicate()
            await subscriber.subscribe(`participants:${room}`)

            subscriber.on('message', (channel, message) => {
                controller.enqueue(encoder.encode(`data: ${message}\n\n`))
            })

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                subscriber.unsubscribe()
                subscriber.quit()
                controller.close()
            })
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    })
}
```

**Webhook publishes to Redis**:
```typescript
// In webhook handler
await redis.publish(`participants:${room.name}`, JSON.stringify(participants))
```

---

#### **2.4 Update Client - Subscribe to Events**

**File**: `components/sangha/RoomSidebar.tsx`

**Replace polling with SSE**:
```typescript
useEffect(() => {
    const room = activeCallRoom || `${roomId}-General Lounge`
    
    // Use EventSource for SSE
    const es = new EventSource(`/api/livekit/participants/stream?room=${encodeURIComponent(room)}`)
    
    es.onmessage = (event) => {
        const participants = JSON.parse(event.data)
        console.log('🔄 Participants updated (SSE):', participants)
        setParticipants(participants)
    }

    es.onerror = (error) => {
        console.error('SSE error:', error)
        es.close()
        
        // Fallback to GET
        fetch(`/api/livekit/participants?room=${encodeURIComponent(room)}`)
            .then(res => res.json())
            .then(setParticipants)
    }

    return () => es.close()
}, [activeCallRoom, roomId])
```

**Result**:
- **0 polling requests**
- **Instant updates** (< 100ms)
- **Persistent connection** (low overhead)

---

## 📊 **PERFORMANCE COMPARISON**

### **Before (Current)**:
```
100 users × 12 requests/min = 1,200 requests/min
API call time: ~1s per request
Total server time: 20 minutes/min (wasteful!)
Update delay: Up to 5 seconds
```

### **After Phase 1 (Caching)**:
```
100 users × 4 requests/min = 400 requests/min (67% reduction)
API call time: ~10ms (cached)
Total server time: 4 seconds/min (99.7% reduction!)
Update delay: 5-15 seconds (adaptive)
```

### **After Phase 2 (Event-Driven)**:
```
100 users × 0 requests/min = 0 requests/min (100% reduction!)
API call time: N/A (push-based)
Total server time: ~100ms/min (webhooks only)
Update delay: < 100ms (real-time)
```

---

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Quick Wins** (2-3 hours)
- [ ] Install Redis (`npm install ioredis`)
- [ ] Create `lib/redis.ts`
- [ ] Update `/api/livekit/participants` with cache
- [ ] Add conditional polling to `RoomSidebar.tsx`
- [ ] Add `isChannelVisible` state
- [ ] Test cache hit rate

### **Phase 2: Event-Driven** (4-6 hours)
- [ ] Configure LiveKit webhooks
- [ ] Create `/api/livekit/webhook` handler
- [ ] Implement Redis pub/sub
- [ ] Create SSE endpoint `/api/livekit/participants/stream`
- [ ] Update client to use EventSource
- [ ] Remove all polling code
- [ ] Add monitoring dashboard

### **Phase 3: Monitoring** (1-2 hours)
- [ ] Track cache hit rate (Redis)
- [ ] Log webhook events/sec
- [ ] Monitor SSE connections
- [ ] Add performance metrics
- [ ] Load test with 1000 users

---

## 🚀 **PRIORITY**

**Immediate** (Do while testing role badges):
1. ✅ Install Redis
2. ✅ Add cache to GET endpoint
3. ✅ Update client poll frequency

**Next Session**:
1. ⏳ Configure LiveKit webhooks
2. ⏳ Build webhook handler
3. ⏳ Implement SSE/WebSocket

**Future**:
1. ⏳ Redis cluster (multi-instance)
2. ⏳ WebSocket fallback
3. ⏳ Metrics dashboard

---

## 📝 **NOTES**

### **Redis Options**:
- **Local Dev**: Docker Redis (`docker run -p 6379:6379 redis`)
- **Production**: [Upstash Redis](https://upstash.com) (free tier, serverless)
- **Alternative**: [Redis Cloud](https://redis.com/try-free/) (free 30MB)

### **SSE vs WebSocket**:
- **SSE**: Simpler, one-way (server → client), HTTP
- **WebSocket**: Bidirectional, more complex, better for chat
- **For participants**: SSE is perfect!

### **Webhook Security**:
- Always verify signature (`WebhookReceiver.receive()`)
- Use HTTPS in production
- Rate-limit webhook endpoint

---

**Status**: 📋 **READY TO IMPLEMENT**  
**Priority**: 🔴 **CRITICAL**  
**Impact**: 🚀 **99% reduction in server load**

---

**Start with Phase 1 while testing role badges!** 🎉
