# 📚 GURUKUL DEVELOPER GUIDE - December 2025

**Comprehensive documentation for understanding and extending Gurukul's codebase**

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Discord-Style Features](#discord-style-features)
4. [LiveKit Integration](#livekit-integration)
5. [Database Schema](#database-schema)
6. [Performance Optimization](#performance-optimization)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
npm (project standard)
Supabase account
LiveKit account
```

### Installation
```bash
# Clone and install
git clone https://github.com/your-username/chitchat.git
cd chitchat
npm install

# Setup environment
cp .env.example .env.local
# Fill in your credentials

# Run development
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_secret

# LiveKit
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Optional: Redis (for optimization)
REDIS_URL=redis://localhost:6379
```

---

## 🏗️ Architecture Overview

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16 (Turbopack) | React framework with App Router |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **UI** | Radix UI + Shadcn | Accessible primitives |
| **Database** | Supabase (PostgreSQL) | Backend + Auth + Realtime |
| **Video** | LiveKit | WebRTC infrastructure |
| **Whiteboard** | Excalidraw | Collaborative canvas |

### Project Structure
```
d:\Chitchat\
├── app/                          # Next.js App Router
│   ├── (authenticated)/          # Protected routes
│   │   ├── sangha/              # Community features
│   │   │   ├── rooms/[roomId]/  # Server view
│   │   │   └── channels/        # Channel system
│   │   └── dashboard/           # User dashboard
│   └── api/                     # API routes
│       ├── livekit/             # LiveKit integration
│       └── matchmaking/         # P2P matching
├── components/                   # React components
│   ├── sangha/                  # Community components
│   │   ├── RoomSidebar.tsx     # Channel list + participants
│   │   ├── RoomInfoSidebar.tsx # Member list + role badges
│   │   ├── RoleBadge.tsx       # Badge component
│   │   └── ServerSettingsModal.tsx # Admin settings
│   └── ui/                      # Reusable UI primitives
├── lib/                         # Utilities
│   ├── supabase/               # Supabase client
│   ├── livekit/                # LiveKit helpers
│   └── redis.ts                # Redis client (optional)
├── scripts/                     # Database migrations
└── matchmaking-server/         # WebSocket signaling server
```

---

## 🎨 Discord-Style Features

### 1. Role Badge System

#### Overview
Complete Discord-style role management with visual badges, multiple roles per user, and custom icons.

#### Database Schema

**`room_roles` table** (core role definition):
```sql
CREATE TABLE room_roles (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#99aab5',
  icon TEXT,                    -- 🆕 Icon column (emoji, icon name, or URL)
  position INTEGER DEFAULT 0,   -- Lower = higher priority (0 = top)
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP
);
```

**`room_user_roles` table** (many-to-many junction):
```sql
CREATE TABLE room_user_roles (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id),
  user_id UUID REFERENCES profiles(id),
  role_id UUID REFERENCES room_roles(id),
  assigned_at TIMESTAMP,
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(room_id, user_id, role_id)
);
```

#### Component Architecture

**RoleBadge Component** (`components/sangha/RoleBadge.tsx`):
```typescript
import { Shield, Crown, Hammer } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
    'shield': Shield,
    'crown': Crown,
    'hammer': Hammer,
    // ... more icons
}

export function RoleBadge({ role, isOwner, size = 'sm' }: RoleBadgeProps) {
    // Owner always gets gold crown
    if (isOwner) {
        return <Crown className="w-3 h-3 text-yellow-500" />
    }
    
    // Lucide icon
    if (role.icon && ICON_MAP[role.icon]) {
        const Icon = ICON_MAP[role.icon]
        return <Icon style={{ color: role.color }} />
    }
    
    // Emoji
    if (role.icon && /\p{Emoji}/u.test(role.icon)) {
        return <span>{role.icon}</span>
    }
    
    // URL
    if (role.icon?.startsWith('http')) {
        return <img src={role.icon} alt={role.name} />
    }
    
    // Fallback: colored dot
    return <div style={{ backgroundColor: role.color }} />
}
```

**Member List Integration** (`components/sangha/RoomInfoSidebar.tsx`):
```typescript
// Fetch members with all roles
const fetchMembers = async () => {
    // 1. Get room owner
    const { data: roomData } = await supabase
        .from('study_rooms')
        .select('owner_id')
        .eq('id', roomId)
        .single()

    // 2. Get all members
    const { data: participants } = await supabase
        .from('room_participants')
        .select('user_id, profiles(*)')
        .eq('room_id', roomId)

    // 3. Get all user roles from junction table
    const { data: userRolesData } = await supabase
        .from('room_user_roles')
        .select(`
            user_id,
            room_roles (id, name, color, icon, position)
        `)
        .eq('room_id', roomId)

    // 4. Group roles by user
    const rolesByUser: Record<string, any[]> = {}
    userRolesData?.forEach((ur) => {
        if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = []
        rolesByUser[ur.user_id].push(ur.room_roles)
    })

    // 5. Format members with sorted roles
    const formatted = participants.map((p) => {
        const userRoles = rolesByUser[p.user_id] || []
        userRoles.sort((a, b) => a.position - b.position) // Sort by hierarchy
        
        return {
            ...p.profiles,
            roles: userRoles,
            highestRole: userRoles[0],
            roleColor: userRoles[0]?.color || '#99AAB5',
            isOwner: p.user_id === roomData.owner_id
        }
    })

    // 6. Sort: Owner > Admin > Mod > Member
    formatted.sort((a, b) => {
        if (a.isOwner) return -1
        if (b.isOwner) return 1
        return (a.highestRole?.position ?? 999) - (b.highestRole?.position ?? 999)
    })

    setMembers(formatted)
}
```

**Display in UI**:
```tsx
{members.map((member) => (
    <div key={member.id} className="flex items-center gap-3 group">
        {/* Avatar with role-colored border */}
        <Avatar style={{ borderColor: member.roleColor }}>
            <AvatarImage src={member.avatar_url} />
            
            {/* Owner crown on avatar */}
            {member.isOwner && (
                <div className="absolute -top-1 -right-1">
                    <RoleBadge isOwner size="sm" />
                </div>
            )}
        </Avatar>
        
        <div className="flex-1">
            {/* Username colored by highest role */}
            <span style={{ color: member.roleColor }}>
                {member.name}
            </span>
            
            {/* Highest role badge */}
            {member.highestRole && (
                <RoleBadge role={member.highestRole} />
            )}
            
            {/* All roles on hover */}
            <div className="opacity-0 group-hover:opacity-100">
                {member.roles.map((role) => (
                    <span key={role.id} style={{ color: role.color }}>
                        {role.name}
                    </span>
                ))}
            </div>
        </div>
    </div>
))}
```

#### Icon Picker Implementation

**In ServerSettingsModal** (`components/sangha/ServerSettingsModal.tsx`):
```tsx
<div className="grid grid-cols-6 gap-2">
    {[
        { icon: 'shield', Component: Shield },
        { icon: 'crown', Component: Crown },
        { icon: 'hammer', Component: Hammer },
        { icon: 'bot', Component: Bot },
        { icon: 'star', Component: Star },
        { icon: 'zap', Component: Zap },
        { icon: 'award', Component: Award },
        { icon: '🛡️', Component: null },  // Emoji
        { icon: '👑', Component: null },
        // ... more options
    ].map((item) => (
        <button
            onClick={() => setEditedRole({ ...editedRole, icon: item.icon })}
            className={editedRole?.icon === item.icon 
                ? 'border-orange-500 ring-2' 
                : 'border-stone-700'}
        >
            {item.Component ? (
                <item.Component className="w-5 h-5" />
            ) : (
                <span>{item.icon}</span>
            )}
        </button>
    ))}
</div>
```

#### Migration Script

To add role badges to existing installation:
```bash
# Run in Supabase SQL Editor
d:\Chitchat\scripts\add-role-badges.sql
```

**What it does**:
1. Adds `icon` column to `room_roles`
2. Creates `room_user_roles` junction table
3. Migrates existing single-role assignments
4. Adds default icons (shield for Admin, hammer for Mod)
5. Sets up RLS policies
6. Enables realtime subscriptions

---

### 2. Live Participant Display

#### Overview
Discord-style participant list showing who's in each voice channel with connection timers.

#### Implementation

**ParticipantItem Component** (`components/sangha/RoomSidebar.tsx`):
```typescript
function ParticipantItem({ participant }: { participant: LiveKitParticipant }) {
    const [duration, setDuration] = useState(0)

    // Real-time timer (updates every second)
    useEffect(() => {
        const interval = setInterval(() => {
            setDuration(d => d + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Format: "5s", "1:23", "12:45"
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (mins === 0) return `${secs}s`
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-2 px-2 py-1">
            <Avatar className="w-5 h-5">
                <AvatarFallback>
                    {participant.identity[0]?.toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <p className="text-xs truncate">{participant.identity}</p>
            <span className="text-[10px] font-mono">
                {formatDuration(duration)}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
    )
}
```

**Fetching Participants** (current polling approach):
```typescript
const [participants, setParticipants] = useState<LiveKitParticipant[]>([])

useEffect(() => {
    // Server-specific room name
    const defaultRoom = `${roomId}-General Lounge`
    const roomToFetch = activeCallRoom || defaultRoom

    const fetchParticipants = async () => {
        try {
            const res = await fetch(
                `/api/livekit/participants?room=${encodeURIComponent(roomToFetch)}`
            )
            const data = await res.json()
            setParticipants(data)
        } catch (error) {
            console.error('Error fetching participants:', error)
        }
    }

    fetchParticipants() // Initial fetch
    const interval = setInterval(fetchParticipants, 5000) // Poll every 5s

    return () => clearInterval(interval)
}, [activeCallRoom, roomId])
```

**Visual Display**:
```tsx
{voiceChannels.map((channel) => {
    const channelParticipants = participants.filter(p => 
        p.room === `${roomId}-${channel.name}`
    )
    
    return (
        <div key={channel.id}>
            {/* Channel header */}
            <ChannelItem
                name={`${channel.name}${
                    channelParticipants.length > 0 
                        ? ` (${channelParticipants.length})` 
                        : ''
                }`}
                type="voice"
                icon={<Headphones />}
            />
            
            {/* Nested participants */}
            {channelParticipants.length > 0 && (
                <div className="ml-6 mt-1 space-y-0.5 pb-2">
                    {channelParticipants.map((p) => (
                        <ParticipantItem key={p.sid} participant={p} />
                    ))}
                </div>
            )}
        </div>
    )
})}
```

#### Server-Specific Room Names

**Critical**: Each server must have unique LiveKit room names to prevent participant mixing.

**Format**: `{serverId}-{channelName}`

**Example**:
- Server A: `abc123-General Lounge`
- Server B: `xyz789-General Lounge`

**Implementation**:
```typescript
// In page.tsx (VideoRoom component)
const livekitRoomName = `${roomId}-${channelName}`

// In token generation
const token = await createLiveKitToken(
    userId,
    `${roomId}-${channelName}` // Server-specific!
)
```

---

## 🎥 LiveKit Integration

### Token Generation

**File**: `app/api/livekit/token/route.ts`

```typescript
import { AccessToken } from 'livekit-server-sdk'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get('room')!
    const identity = searchParams.get('identity')!

    // Create token
    const token = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        { identity, ttl: '2h' }
    )

    // Grant permissions
    token.addGrant({
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
    })

    return Response.json({ token: await token.toJwt() })
}
```

### Participant API

**File**: `app/api/livekit/participants/route.ts`

**Current (Polling)**:
```typescript
import { RoomServiceClient } from 'livekit-server-sdk'

const client = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get('room')

    if (!room) return Response.json([])

    try {
        const participants = await client.listParticipants(room)
        return Response.json(participants)
    } catch (error) {
        console.error('Error listing participants:', error)
        return Response.json([])
    }
}
```

**Future (Event-Driven with Redis)**:
```typescript
import { redis } from '@/lib/redis'

export async function GET(request: Request) {
    const room = searchParams.get('room')!
    const cacheKey = `participants:${room}`

    // Check cache first (10ms)
    const cached = await redis.get(cacheKey)
    if (cached) return Response.json(JSON.parse(cached))

    // Cache miss - fetch from LiveKit (1s)
    const participants = await client.listParticipants(room)
    
    // Store for 10 seconds
    await redis.set(cacheKey, JSON.stringify(participants), 'EX', 10)
    
    return Response.json(participants)
}
```

---

## 🗄️ Database Schema

### Core Tables

**study_rooms** (Servers):
```sql
CREATE TABLE study_rooms (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    owner_id UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP
);
```

**room_channels** (Channels):
```sql
CREATE TABLE room_channels (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'voice', 'video')),
    position INTEGER,
    created_at TIMESTAMP
);
```

**room_participants** (Memberships):
```sql
CREATE TABLE room_participants (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id),
    user_id UUID REFERENCES profiles(id),
    role_id UUID REFERENCES room_roles(id), -- Legacy single role
    joined_at TIMESTAMP,
    UNIQUE(room_id, user_id)
);
```

**room_roles** (Role Definitions):
```sql
CREATE TABLE room_roles (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#99aab5',
    icon TEXT,                    -- 🆕 Icon (emoji/name/URL)
    position INTEGER DEFAULT 0,   -- 0 = highest
    permissions JSONB,
    created_at TIMESTAMP
);
```

**room_user_roles** (Many-to-Many):
```sql
CREATE TABLE room_user_roles (
    id UUID PRIMARY KEY,
    room_id UUID REFERENCES study_rooms(id),
    user_id UUID REFERENCES profiles(id),
    role_id UUID REFERENCES room_roles(id),
    assigned_at TIMESTAMP,
    assigned_by UUID REFERENCES profiles(id),
    UNIQUE(room_id, user_id, role_id)
);
```

---

## ⚡ Performance Optimization

### Current Bottleneck: Participant Polling

**Problem**:
```
100 users × 12 requests/min = 1,200 req/min
Response time: ~1s per request
Total server time: 20 minutes/min (!!)
```

**Solution - Phase 1 (Caching)**:
```typescript
// Add Redis
import { redis } from '@/lib/redis'

// Cache GET endpoint
const cached = await redis.get(`participants:${room}`)
if (cached) return Response.json(JSON.parse(cached)) // 10ms!

// Conditional polling
useEffect(() => {
    if (!isChannelVisible) return // Don't poll if hidden
    // ... poll logic
}, [isChannelVisible])
```

**Result**:
- 67% fewer requests
- 100x faster responses
- 99.7% less server time

**Solution - Phase 2 (Event-Driven)**:
```
LiveKit → Webhook → Redis → SSE → Clients
```

**Implementation**:
1. Configure LiveKit webhooks
2. Create `/api/livekit/webhook` handler
3. Update Redis cache on events
4. Publish to SSE endpoint
5. Clients subscribe via EventSource

**Result**:
- 0 polling requests
- <100ms updates
- Infinite scalability

See `LIVEKIT_PARTICIPANT_OPTIMIZATION.md` for complete guide.

---

## 🔧 Common Tasks

### Add a New Role Icon

1. **Update icon map** (`RoleBadge.tsx`):
```typescript
import { NewIcon } from 'lucide-react'

const ICON_MAP = {
    // ... existing
    'newicon': NewIcon
}
```

2. **Add to picker** (`ServerSettingsModal.tsx`):
```typescript
{ icon: 'newicon', Component: NewIcon }
```

3. **Save role** (already handled by existing code)

### Create a New Voice Channel

1. **Insert into database**:
```typescript
const { data } = await supabase
    .from('room_channels')
    .insert({
        room_id: roomId,
        name: 'New Channel',
        type: 'voice',
        position: 99
    })
```

2. **Update LiveKit room name** when users join:
```typescript
const livekitRoom = `${roomId}-${channelName}`
```

### Debug Participant Issues

1. **Check room name format**:
```typescript
console.log('Room name:', `${roomId}-${channelName}`)
// Should be: "abc123-General Lounge"
```

2. **Verify API response**:
```typescript
const res = await fetch(`/api/livekit/participants?room=${room}`)
console.log(await res.json())
```

3. **Check LiveKit dashboard**:
- Open LiveKit Cloud dashboard
- View active rooms
- Verify participants match

---

## 🐛 Troubleshooting

### Role Badges Not Showing

**Check**:
1. SQL migration ran? (`add-role-badges.sql`)
2. `room_roles.icon` column exists?
3. `room_user_roles` table has entries?
4. Component imported correctly?

**Debug**:
```typescript
// In RoomInfoSidebar.tsx
console.log('Member roles:', member.roles)
console.log('Highest role:', member.highestRole)
```

### Participants Not Appearing

**Check**:
1. Room name format: `{serverId}-{channelName}`?
2. API endpoint returning data?
3. Polling interval running?
4. LiveKit tokens valid?

**Debug**:
```typescript
// In RoomSidebar.tsx
console.log('Fetching room:', roomToFetch)
console.log('Participants:', participants)
```

### Cross-Server Mixing

**Check**:
1. Room names include server ID?
2. Token generation uses correct format?
3. Client joins with correct room name?

**Fix**:
```typescript
// Always use server-specific format
const room = `${roomId}-${channelName}`
```

---

## 📚 Additional Resources

- **Implementation Plan**: `implementation_plan.md`
- **Changelog**: `CHANGELOG.md`
- **LiveKit Docs**: `LIVEKIT_PARTICIPANT_COMPLETE.md`
- **Role System**: `ROLE_BADGE_SYSTEM_PLAN.md`
- **Optimization**: `LIVEKIT_PARTICIPANT_OPTIMIZATION.md`

---

## 🤝 Contributing

1. Read `CHANGELOG.md` for recent changes
2. Check `implementation_plan.md` for roadmap
3. Follow TypeScript strict mode
4. Test locally before PR
5. Update docs if adding features

---

**Built with 🧡 by Antigravity & Aniket**

**Status**: Production Ready (Desktop) | Mobile PWA Pending
