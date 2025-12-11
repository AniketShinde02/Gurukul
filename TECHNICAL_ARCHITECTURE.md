# 🔧 GURUKUL MATCHMAKING - COMPLETE TECHNICAL ARCHITECTURE
**Deep Dive Technical Audit & System Design Document**

---

## 1. ARCHITECTURE DIAGRAM (Short)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GURUKUL MATCHMAKING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐         ┌───────────────────┐         ┌──────────────┐       │
│  │  Client  │──HTTP──▶│   Vercel Edge     │──SQL──▶│   Supabase   │       │
│  │ (React)  │         │  (Next.js API)    │         │ (PostgreSQL) │       │
│  └────┬─────┘         └─────────┬─────────┘         └──────┬───────┘       │
│       │                         │                          │               │
│       │    ┌────────────────────┼──────────────────────────┘               │
│       │    │                    │                                          │
│       │    │  WebSocket         │ Realtime                                 │
│       │    ▼                    ▼                                          │
│       │  ┌─────────────────────────────────┐                               │
│       │  │     Supabase Realtime           │                               │
│       │  │   (Phoenix Channels/WS)         │                               │
│       │  └─────────────────────────────────┘                               │
│       │                                                                     │
│       │         ┌───────────────────────────────────────┐                  │
│       └────────▶│            WebRTC P2P                 │◀─── STUN/TURN   │
│                 │   (Video/Audio - Peer to Peer)        │                  │
│                 └───────────────────────────────────────┘                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  SERVICES:                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ Signaling      │  │ Database       │  │ TURN Server    │  │ SFU       │ │
│  │ Supabase RT    │  │ PostgreSQL     │  │ Google STUN    │  │ N/A (P2P) │ │
│  │ (WebSocket)    │  │ (Supabase)     │  │ (Free)         │  │           │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └───────────┘ │
│                                                                              │
│  NO Redis, NO Load Balancer, NO SFU (pure P2P)                              │
│  Single serverless instance (Vercel Edge Functions)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**One Paragraph Summary:**
The matchmaking system uses a serverless architecture with Vercel Edge Functions handling API requests, Supabase PostgreSQL for persistent queue storage and session management, and Supabase Realtime (built on Phoenix Channels) for WebSocket-based notifications. Video/audio uses pure WebRTC P2P connections with Google's free STUN servers - no media goes through our servers. There's no Redis, no dedicated signaling server, no load balancer, and no SFU - keeping infrastructure costs at $0.

---

## 2. SIGNALING SERVER DETAILS

### Technology Stack
```json
{
  "signaling_server": {
    "type": "Supabase Realtime",
    "underlying_tech": "Phoenix Channels (Elixir)",
    "transport": "WebSocket",
    "protocol": "Supabase Realtime Protocol",
    "client_library": "@supabase/supabase-js",
    "version": "2.x"
  },
  "alternative_considered": [
    "Socket.IO (Node.js) - rejected: extra server needed",
    "uWebSockets.js - rejected: complexity",
    "Go/Gorilla - rejected: different stack"
  ]
}
```

### Concurrency Limits (CRITICAL)
```
┌─────────────────────────────────────────────────────────────────┐
│           SUPABASE REALTIME WEBSOCKET LIMITS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FREE TIER:                                                      │
│  ├── Max Concurrent Connections: 200                             │
│  ├── Max Channels per Connection: 100                            │
│  ├── Messages per Second: ~100                                   │
│  └── Broadcast Limit: 10 msg/sec/channel                         │
│                                                                  │
│  PRO TIER ($25/mo):                                              │
│  ├── Max Concurrent Connections: 500                             │
│  ├── Max Channels per Connection: 100                            │
│  ├── Messages per Second: ~500                                   │
│  └── Broadcast Limit: 100 msg/sec/channel                        │
│                                                                  │
│  TEAM TIER ($599/mo):                                            │
│  ├── Max Concurrent Connections: 10,000+                         │
│  └── Configurable limits                                         │
│                                                                  │
│  CURRENT INFRA (Free): ~200 concurrent WebSocket connections     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. MATCHMAKING ALGORITHM (Pseudocode)

### Exact Flow - When User Clicks "Find Partner"

```
┌─────────────────────────────────────────────────────────────────┐
│              MATCHMAKING FLOW - STEP BY STEP                     │
├─────────────────────────────────────────────────────────────────┤

STEP 1: CLIENT (useMatchmaking.ts)
─────────────────────────────────────
User clicks "Find Partner"
    │
    ▼
startMatching(matchMode = 'buddies_first' | 'global')
    │
    ├── cleanup() // Clear any previous state
    ├── isSearchingRef.current = true
    ├── setStatus('searching')
    ├── play('CALL_INCOMING', { loop: true })
    │
    ▼
    
STEP 2: API CALL (POST /api/matching/join)
─────────────────────────────────────────────
fetch('/api/matching/join', { matchMode })
    │
    ▼
Server-side:
    ├── getUser() // Auth check
    ├── Check active session → Auto-end if exists
    ├── DELETE FROM waiting_queue WHERE user_id = ?
    ├── INSERT INTO waiting_queue (user_id, joined_at)
    └── findMatch(userId, matchMode) // ASYNC - don't wait
    
STEP 3: DB PROCEDURE (find_match RPC)
───────────────────────────────────────
find_match(p_user_id, p_match_mode):
    │
    ├── pg_try_advisory_xact_lock('matchmaking_lock') // Prevent race
    │   └── IF NOT acquired → RETURN 'System busy, retry'
    │
    ├── DELETE stale entries (> 2 minutes old)
    │
    ├── IF mode = 'buddies_first':
    │   └── SELECT partner FROM waiting_queue 
    │       JOIN study_connections (buddies only)
    │       FOR UPDATE SKIP LOCKED // Non-blocking
    │
    ├── IF no buddy found:
    │   └── SELECT partner FROM waiting_queue (anyone)
    │       ORDER BY joined_at ASC LIMIT 1
    │       FOR UPDATE SKIP LOCKED
    │
    ├── IF partner found:
    │   ├── DELETE both from waiting_queue
    │   ├── INSERT INTO chat_sessions (user1, user2, 'active')
    │   └── RETURN { match_found: true, session_id, partner_id }
    │
    └── ELSE:
        ├── UPSERT user into waiting_queue
        └── RETURN { match_found: false }

STEP 4: CLIENT DETECTION (Realtime + Polling)
───────────────────────────────────────────────
Parallel mechanisms:
    │
    ├── Supabase Realtime Channel:
    │   └── SUBSCRIBE to postgres_changes
    │       ON INSERT chat_sessions 
    │       WHERE user1_id = me OR user2_id = me
    │       → handleMatchFound()
    │
    └── Fallback Polling (every 3 seconds):
        └── SELECT FROM chat_sessions 
            WHERE (user1 = me OR user2 = me) 
            AND status = 'active'
            → handleMatchFound()

STEP 5: MATCH FOUND
─────────────────────
handleMatchFound({ session_id, partner_id }):
    ├── isSearchingRef.current = false
    ├── Stop polling
    ├── Unsubscribe from channel
    ├── play('MATCH_FOUND')
    ├── setStatus('connecting')
    └── setSessionId(session_id)

STEP 6: WebRTC HANDSHAKE (useWebRTC.ts)
─────────────────────────────────────────
connectToSession(session_id):
    ├── initializePeerConnection()
    │   ├── getUserMedia({ video, audio })
    │   └── Create RTCPeerConnection
    │
    ├── User1 (first to connect):
    │   └── createOffer() → send via messages table
    │
    └── User2 (receives offer):
        ├── setRemoteDescription(offer)
        ├── createAnswer() → send via messages table
        └── Exchange ICE candidates → P2P connected!

└─────────────────────────────────────────────────────────────────┘
```

### Actual Code (TypeScript)

**Client - startMatching:**
```typescript
// hooks/useMatchmaking.ts - Lines 101-221
const startMatching = useCallback(async (matchMode) => {
    if (isSearchingRef.current) return;
    cleanup();
    isSearchingRef.current = true;
    setStatus('searching');

    // 1. Join queue via API
    await fetch('/api/matching/join', {
        method: 'POST',
        body: JSON.stringify({ matchMode })
    });

    // 2. Setup realtime subscription
    const channel = supabase
        .channel(`matchmaking:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT', table: 'chat_sessions',
            filter: `user1_id=eq.${userId}`
        }, (payload) => handleMatchFound(payload))
        .subscribe();

    // 3. Fallback polling
    pollingIntervalRef.current = setInterval(async () => {
        const { data: session } = await supabase
            .from('chat_sessions')
            .select('id, user1_id, user2_id')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .eq('status', 'active')
            .limit(1).maybeSingle();
        
        if (session) handleMatchFound(session);
    }, 3000);
}, [userId]);
```

**Server - find_match (PostgreSQL):**
```sql
-- scripts/deploy-production-matchmaking.sql - Lines 38-123
CREATE OR REPLACE FUNCTION find_match(p_user_id UUID, p_match_mode TEXT)
RETURNS TABLE (match_found BOOLEAN, session_id UUID, partner_id UUID, message TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_partner_id UUID;
    v_session_id UUID;
BEGIN
    -- Acquire advisory lock (prevents race conditions)
    IF NOT pg_try_advisory_xact_lock(hashtext('matchmaking_lock')) THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'System busy';
        RETURN;
    END IF;

    -- Find oldest waiting user (SKIP LOCKED = non-blocking)
    SELECT user_id INTO v_partner_id
    FROM waiting_queue
    WHERE user_id != p_user_id
    ORDER BY joined_at ASC LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_partner_id IS NOT NULL THEN
        -- Remove both from queue
        DELETE FROM waiting_queue WHERE user_id IN (p_user_id, v_partner_id);
        
        -- Create session
        INSERT INTO chat_sessions (user1_id, user2_id, status, started_at)
        VALUES (p_user_id, v_partner_id, 'active', NOW())
        RETURNING id INTO v_session_id;

        RETURN QUERY SELECT true, v_session_id, v_partner_id, 'Match found'::TEXT;
    ELSE
        -- Add to queue
        INSERT INTO waiting_queue (user_id, joined_at) VALUES (p_user_id, NOW())
        ON CONFLICT (user_id) DO UPDATE SET joined_at = NOW();
        
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Queued'::TEXT;
    END IF;
END;
$$;
```

---

## 4. QUEUE IMPLEMENTATION

### Where is the Queue Stored?
```json
{
  "queue_storage": "PostgreSQL (Supabase)",
  "table_name": "waiting_queue",
  "is_in_memory": false,
  "is_redis": false,
  "sticky_routing": "Not applicable (serverless)",
  
  "schema": {
    "id": "UUID PRIMARY KEY",
    "user_id": "UUID UNIQUE (FK to auth.users)",
    "match_mode": "TEXT DEFAULT 'buddies_first'",
    "joined_at": "TIMESTAMPTZ DEFAULT NOW()"
  },
  
  "indexes": [
    "idx_waiting_queue_joined_at ON waiting_queue(joined_at DESC)",
    "PRIMARY KEY (user_id) - ensures one entry per user"
  ]
}
```

### Why Not In-Memory?
```
Serverless (Vercel Edge) → No persistent memory between requests
Each API call = new instance = memory is wiped

┌─────────────────────────────────────────────────────────────────┐
│  Request 1 → Instance A → [User1 in memory] → Instance dies    │
│  Request 2 → Instance B → [Memory empty!] → Can't find User1   │
│                                                                  │
│  Solution: Store queue in PostgreSQL (persistent)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. POLLING / DB USAGE (CRITICAL)

### Polling Configuration
```json
{
  "polling_enabled": true,
  "poll_interval_ms": 3000,
  "poll_endpoint": "Supabase PostgREST (chat_sessions table)",
  "purpose": "Fallback if realtime subscription misses events"
}
```

### QPS Calculations at 10K Users
```
┌─────────────────────────────────────────────────────────────────┐
│                    POLLING LOAD ANALYSIS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Active users searching: 10,000                                  │
│  Poll interval: 3 seconds                                        │
│  Polls per user per second: 1/3 = 0.33                          │
│                                                                  │
│  TOTAL QPS = 10,000 × 0.33 = 3,333 queries/second               │
│                                                                  │
│  ⚠️  This is TOO HIGH for PostgreSQL free tier!                 │
│                                                                  │
│  MITIGATION:                                                     │
│  1. Realtime is primary (polling is fallback only)              │
│  2. Most users get matched via Realtime → never poll            │
│  3. Realistic searching users: 100-500 (not 10K)                │
│  4. Actual QPS: ~33-166 queries/sec (manageable)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DB Queries Per Match Operation
```sql
-- Query 1: Join Queue API
DELETE FROM waiting_queue WHERE user_id = ?;     -- 1 write
INSERT INTO waiting_queue (...);                  -- 1 write

-- Query 2: find_match RPC (worst case)
SELECT ... FROM waiting_queue FOR UPDATE SKIP LOCKED;  -- 1 read
DELETE FROM waiting_queue WHERE user_id IN (?, ?);     -- 1 write
INSERT INTO chat_sessions (...);                        -- 1 write

-- Query 3: Polling (per user, every 3s while searching)
SELECT id, user1_id, user2_id FROM chat_sessions 
WHERE (user1_id = ? OR user2_id = ?) AND status = 'active';  -- 1 read

-- TOTAL per successful match: 5-6 queries
-- TOTAL per poll cycle: 1 query per searching user
```

---

## 6. ADVISORY LOCKS / TRANSACTIONS

### Lock Implementation
```json
{
  "lock_type": "PostgreSQL Advisory Lock (Transaction-level)",
  "lock_function": "pg_try_advisory_xact_lock(hashtext('matchmaking_lock'))",
  "lock_purpose": "Prevent race conditions when two users match simultaneously",
  
  "behavior": {
    "non_blocking": true,
    "auto_release": "On transaction commit/rollback",
    "contention_handling": "If lock not acquired, return 'System busy, retry'"
  }
}
```

### Lock Hold Times
```
┌─────────────────────────────────────────────────────────────────┐
│                   ADVISORY LOCK TIMING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Lock acquired at: find_match() entry                            │
│  Lock released at: Transaction commit (function return)          │
│                                                                  │
│  Operations while lock held:                                     │
│    1. DELETE stale queue entries (~5ms)                          │
│    2. SELECT partner (~2ms)                                      │
│    3. DELETE matched users (~2ms)                                │
│    4. INSERT chat_session (~2ms)                                 │
│                                                                  │
│  ─────────────────────────────────────────────────               │
│  TOTAL LOCK HOLD TIME: ~10-15ms                                  │
│  ─────────────────────────────────────────────────               │
│                                                                  │
│  At 10K concurrent users trying to match:                        │
│  Throughput = 1000ms / 15ms = ~66 matches/second                 │
│                                                                  │
│  ⚠️  This is the bottleneck for PostgreSQL-based matching       │
│  🔧 Solution at scale: Redis (no locks needed)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. TURN / STUN SETUP (CRITICAL)

### Current Configuration
```json
{
  "stun_servers": [
    { "urls": "stun:stun.l.google.com:19302" },
    { "urls": "stun:stun1.l.google.com:19302" }
  ],
  
  "turn_server": {
    "enabled": false,
    "reason": "Not deployed yet",
    "impact": "10-15% of users behind strict NAT cannot connect P2P"
  },
  
  "coturn_deployed": false,
  "coturn_hosting": "N/A",
  "coturn_specs": "N/A",
  "allocate_failure_logs": "Not collected (ICE failures logged client-side)"
}
```

### Actual WebRTC Config
```typescript
// hooks/useWebRTC.ts - Lines 6-11
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
    // ❌ No TURN server configured
}
```

### Recommended TURN Setup
```json
{
  "recommended_turn": {
    "provider": "Metered.ca or Twilio",
    "free_tier": "50GB/month (Metered)",
    "cost_estimate": "$0-20/month",
    
    "config": {
      "urls": "turn:relay.metered.ca:443",
      "username": "METERED_USERNAME",
      "credential": "METERED_CREDENTIAL",
      "credentialType": "password"
    },
    
    "benefits": [
      "100% connection success rate",
      "Works behind corporate firewalls",
      "Works on 4G/5G networks with carrier NAT"
    ]
  }
}
```

---

## 8. FAILURE MODES & RETRIES (CRITICAL)

### Scenario 1: Peer Disconnects Mid-Match
```
┌─────────────────────────────────────────────────────────────────┐
│  User A ◄──────── WebRTC P2P ────────► User B                   │
│                       │                                          │
│                       │ User B closes tab                        │
│                       ▼                                          │
│  User A detects: pc.onconnectionstatechange → 'disconnected'    │
│                       │                                          │
│                       ▼                                          │
│  Behavior:                                                       │
│    1. Toast: "Partner left the call"                             │
│    2. UI: "Waiting for partner..." (if they might reconnect)    │
│    3. After timeout: Clean up local streams                      │
│                                                                  │
│  ⚠️  Session NOT automatically ended in DB                      │
│  🔧 User must click "End Chat" to properly close                │
└─────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Orphaned Queue Entries
```
┌─────────────────────────────────────────────────────────────────┐
│  Problem: User joins queue, then closes browser without cancel  │
│                                                                  │
│  Entry in waiting_queue: { user_id: X, joined_at: 2 min ago }   │
│                                                                  │
│  ⚠️  Without cleanup, user X blocks others from matching        │
│                                                                  │
│  CURRENT SOLUTION:                                               │
│  1. find_match() auto-deletes entries > 2 minutes old           │
│  2. On new join, DELETE existing entry for same user first      │
│  3. cleanup_matchmaking() function for batch cleanup            │
│                                                                  │
│  ❌ NO scheduled job running cleanup (manual only)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Retry Behavior
```json
{
  "api_retry": {
    "enabled": false,
    "reason": "Single attempt, user can retry manually"
  },
  "polling_retry": {
    "enabled": true,
    "behavior": "Continues polling every 3s until match or cancel"
  },
  "webrtc_retry": {
    "enabled": false,
    "ice_restart": "Not implemented",
    "recommended": "Implement ICE restart on disconnect"
  }
}
```

---

## 9. METRICS & LOGS (No Active Monitoring)

### Current State
```json
{
  "prometheus": false,
  "grafana": false,
  "sentry": false,
  "custom_metrics": false,
  
  "available_logs": {
    "vercel_logs": "API route execution (last 1 hour free)",
    "supabase_logs": "Database queries (last 24 hours free)",
    "browser_console": "Client-side errors"
  },
  
  "collected_metrics": "NONE",
  
  "sample_data": "NOT AVAILABLE - No monitoring system deployed"
}
```

### Recommended Metrics (To Implement)
```json
{
  "recommended_metrics": [
    {
      "name": "matchmaking_queue_length",
      "type": "gauge",
      "query": "SELECT COUNT(*) FROM waiting_queue"
    },
    {
      "name": "matchmaking_latency_ms",
      "type": "histogram",
      "measurement": "Time from join to match_found"
    },
    {
      "name": "active_sessions_count",
      "type": "gauge",
      "query": "SELECT COUNT(*) FROM chat_sessions WHERE status = 'active'"
    },
    {
      "name": "websocket_connections",
      "type": "gauge",
      "source": "Supabase Dashboard (manual)"
    }
  ]
}
```

---

## 10. RESOURCE USAGE PER INSTANCE

### Vercel Edge Function (Signaling/API)
```json
{
  "runtime": "Vercel Edge Functions",
  "memory_limit_mb": 128,
  "cpu_limit": "Shared (serverless)",
  "timeout_ms": 30000,
  "cold_start_ms": "50-200ms",
  
  "per_request_usage": {
    "memory_mb": "10-30",
    "cpu_time_ms": "5-50",
    "network_kb": "1-5"
  },
  
  "concurrency": "Auto-scaled by Vercel (no hard limit)",
  
  "bottleneck": "Not the Edge Function - it's PostgreSQL connections"
}
```

### TURN Server (Not Deployed)
```json
{
  "deployed": false,
  "cpu_usage": "N/A",
  "memory_usage": "N/A",
  "network_mbps": "N/A",
  
  "recommended_specs": {
    "cpu": "2 vCPUs",
    "ram": "4GB",
    "network": "100Mbps minimum",
    "capacity": "~500 simultaneous relay users"
  }
}
```

---

## 11. STICKY SESSIONS / HORIZONTAL SCALING

### Load Balancer Configuration
```json
{
  "load_balancer": "Vercel (built-in)",
  "sticky_sessions": false,
  "routing_algorithm": "Random/Round-robin (serverless)",
  
  "signaling_sync": {
    "method": "Supabase Realtime (shared WebSocket hub)",
    "how_it_works": "All instances subscribe to same Supabase channel",
    "cross_instance_sync": "Automatic via PostgreSQL + Realtime"
  },
  
  "multi_instance_behavior": {
    "request_1_on_instance_A": "Adds user to queue in PostgreSQL",
    "request_2_on_instance_B": "Reads same queue from PostgreSQL",
    "matching": "Happens via RPC (PostgreSQL handles atomicity)"
  }
}
```

### Why Sticky Sessions Not Needed
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Traditional: Session state in server memory → Need sticky      │
│                                                                  │
│  Our Architecture: All state in PostgreSQL/Supabase             │
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │ Vercel   │     │ Vercel   │     │ Vercel   │                │
│  │ Edge A   │     │ Edge B   │     │ Edge C   │                │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘                │
│       │                │                │                       │
│       └────────────────┼────────────────┘                       │
│                        ▼                                         │
│              ┌─────────────────┐                                │
│              │    Supabase     │                                │
│              │  (Single Source │                                │
│              │   of Truth)     │                                │
│              └─────────────────┘                                │
│                                                                  │
│  Any instance can handle any request → No sticky needed         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. PERSISTENCE / CRASH RECOVERY

### What Happens on Server Restart
```json
{
  "signaling_process_restart": {
    "waiting_users_lost": 0,
    "reason": "Queue stored in PostgreSQL, not memory"
  },
  
  "supabase_restart": {
    "impact": "All realtime subscriptions disconnected",
    "recovery": "Clients auto-reconnect (supabase-js handles this)"
  },
  
  "vercel_edge_restart": {
    "impact": "Individual request fails",
    "recovery": "Next request goes to healthy instance"
  }
}
```

### Persisted vs Volatile Data
```
┌─────────────────────────────────────────────────────────────────┐
│  PERSISTED (Survives restart):                                   │
│  ├── waiting_queue table                                         │
│  ├── chat_sessions table                                         │
│  ├── messages table                                              │
│  └── All user data                                               │
│                                                                  │
│  VOLATILE (Lost on restart):                                     │
│  ├── Active WebSocket connections (temp disconnect)              │
│  ├── Client-side React state                                     │
│  ├── WebRTC peer connections                                     │
│  └── Audio/video streams                                         │
│                                                                  │
│  RECOVERY BEHAVIOR:                                              │
│  └── User refreshes page → Rejoins queue → Continues             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. SECURITY & RATE LIMITS

### Current Implementation
```json
{
  "rate_limiting": {
    "enabled": false,
    "reason": "Not implemented yet"
  },
  
  "authentication": {
    "method": "Supabase Auth (JWT)",
    "enforcement": "API routes check auth before queue operations"
  },
  
  "bot_prevention": {
    "captcha": false,
    "token_validation": "JWT only",
    "cooldown": "None (can spam Start button)"
  },
  
  "rls_policies": {
    "waiting_queue": "Users can only see/modify their own entry",
    "chat_sessions": "Users can only see sessions they're part of"
  }
}
```

### Attack Surface
```
┌─────────────────────────────────────────────────────────────────┐
│  VULNERABILITIES:                                                │
│                                                                  │
│  1. Queue Spam: Malicious user can repeatedly join/leave queue  │
│     Impact: Pollutes queue, wastes DB writes                     │
│     Mitigation: Add rate limit (10 joins/minute)                │
│                                                                  │
│  2. Session Hijack: No verification that ICE candidates         │
│     come from legitimate peer                                    │
│     Impact: Low (signaling goes through DB, auth required)      │
│                                                                  │
│  3. DoS via Polling: 1000 malicious clients = 333 QPS           │
│     Impact: Database overload                                    │
│     Mitigation: Add rate limit, disable polling for new users   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. CLIENT-SIDE BEHAVIOR

### Event Sequence on Page Load
```
┌─────────────────────────────────────────────────────────────────┐
│  USER OPENS /chat PAGE                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. React mounts ChatPage component                              │
│                                                                  │
│  2. useEffect → supabase.auth.getUser()                          │
│     └── If not logged in → redirect to /                         │
│                                                                  │
│  3. useMatchmaking(userId) hook initializes                      │
│     └── Sets status = 'idle'                                     │
│     └── NO auto-join queue (waits for button click)             │
│                                                                  │
│  4. useWebRTC(sessionId) hook initializes                        │
│     └── NO media request yet (waits for match)                  │
│                                                                  │
│  5. UI shows "Ready to Study?" with Start button                 │
│                                                                  │
│  === USER CLICKS "Find Partner" ===                              │
│                                                                  │
│  6. startMatching() called                                       │
│     └── Opens Supabase Realtime WebSocket                        │
│     └── Calls /api/matching/join                                 │
│     └── Starts polling interval                                  │
│                                                                  │
│  === MATCH FOUND ===                                             │
│                                                                  │
│  7. handleMatchFound() → status = 'connecting'                   │
│                                                                  │
│  8. connectToSession() called                                    │
│     └── NOW requests camera/mic: getUserMedia()                  │
│     └── Creates RTCPeerConnection                                │
│     └── Starts WebRTC handshake                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. REPRO STEPS FOR FAILURE (CRITICAL)

### Test Script: Simulate Queue Backpressure
```bash
# 1. Open browser developer console

# 2. Run this in console to simulate 100 join attempts:
for (let i = 0; i < 100; i++) {
    fetch('/api/matching/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchMode: 'global' })
    }).then(r => console.log(i, r.status));
}

# Expected results:
# - First ~10 should succeed (200)
# - Others may fail (500) if DB connection limit hit
# - Check Supabase Dashboard → Database → Active Connections
```

### Test Script: Simulate Stuck User
```bash
# 1. User A opens /chat and clicks "Find Partner"
# 2. User A closes browser without clicking Cancel
# 3. Wait 2 minutes
# 4. User B opens /chat and clicks "Find Partner"

# Expected: User B should NOT match with stale User A entry
# Actual: find_match() auto-deletes entries > 2 min

# To verify, run in Supabase SQL Editor:
SELECT * FROM waiting_queue ORDER BY joined_at DESC;
```

---

## 16. SAMPLE CODE & CONFIGS

### Server Start Config (Vercel)
```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["bom1"],
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Docker Compose (If Self-Hosting)
```yaml
# Not currently used - Vercel serverless
# Included for reference if migrating to self-hosted

version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
```

---

## 17. CURRENT LIMITS & THRESHOLDS

```json
{
  "per_room_limits": {
    "participants": 2,
    "reason": "1-on-1 video chat only"
  },
  
  "per_user_limits": {
    "concurrent_sessions": 1,
    "queue_entries": 1,
    "rate_limit": "None (TODO)"
  },
  
  "hard_coded_caps": {
    "queue_entry_ttl_minutes": 2,
    "session_auto_end_hours": 2,
    "poll_interval_ms": 3000,
    "max_websocket_channels": 100
  },
  
  "supabase_free_limits": {
    "db_connections": 60,
    "realtime_connections": 200,
    "storage_gb": 1,
    "bandwidth_gb": 2
  }
}
```

---

## 18. MONITORING / ALERTING

### Current State
```json
{
  "monitoring_deployed": false,
  "alerting_deployed": false,
  
  "available_dashboards": [
    "Supabase Dashboard (manual check)",
    "Vercel Dashboard (manual check)",
    "Browser DevTools (client-side)"
  ],
  
  "prometheus_grafana": "Not deployed",
  "pagerduty_integration": "None",
  "slack_alerts": "None",
  
  "request_latency_tracking": "Vercel Analytics (limited)",
  "error_tracking": "Console logs only"
}
```

### Recommended Setup
```yaml
# docker-compose.monitoring.yml (Future)
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 📋 SUMMARY JSON (All Critical Details)

```json
{
  "architecture": {
    "type": "Serverless + PostgreSQL",
    "signaling": "Supabase Realtime (WebSocket)",
    "database": "Supabase PostgreSQL",
    "turn": "NOT DEPLOYED (Google STUN only)",
    "sfu": "None (P2P)",
    "redis": "None",
    "load_balancer": "Vercel (built-in)"
  },
  
  "concurrency": {
    "max_websocket_connections": 200,
    "max_db_connections": 60,
    "max_concurrent_users": "200-500",
    "max_matches_per_second": 66
  },
  
  "queue": {
    "storage": "PostgreSQL (waiting_queue table)",
    "lock_mechanism": "Advisory locks (pg_try_advisory_xact_lock)",
    "ttl_minutes": 2
  },
  
  "polling": {
    "enabled": true,
    "interval_ms": 3000,
    "qps_at_10k_users": 3333,
    "mitigation": "Realtime is primary, polling is fallback"
  },
  
  "failure_handling": {
    "orphaned_entries": "Auto-deleted after 2 minutes",
    "peer_disconnect": "UI notification, manual cleanup required",
    "server_restart": "Zero data loss (PostgreSQL persisted)"
  },
  
  "security": {
    "auth": "Supabase Auth (JWT)",
    "rate_limiting": "NOT IMPLEMENTED",
    "bot_prevention": "NOT IMPLEMENTED"
  },
  
  "monitoring": {
    "prometheus": false,
    "grafana": false,
    "sentry": false
  },
  
  "scaling_path": {
    "current_capacity": "200-500 users",
    "upgrade_1": "Supabase Pro ($25/mo) → 3K users",
    "upgrade_2": "Add Redis → 10K users",
    "upgrade_3": "Add TURN → 100% connection success"
  }
}
```

---

*Document Generated: December 11, 2025*
*System: Gurukul - Digital Ashram for Study*
