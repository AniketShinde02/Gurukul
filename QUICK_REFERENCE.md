# 🚀 QUICK REFERENCE GUIDE - GURUKUL
**For:** Developers, Contributors, Maintainers  
**Last Updated:** December 16, 2025

---

## ⚡ QUICK START (5 Minutes)

### Local Development
```bash
# 1. Clone & Install
git clone https://github.com/your-username/chitchat.git
cd chitchat
npm install

# 2. Environment Variables
cp .env.example .env.local
# Fill in:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - LIVEKIT_API_KEY
# - LIVEKIT_API_SECRET
# - NEXT_PUBLIC_LIVEKIT_URL

# 3. Run Database Migrations
# Open Supabase SQL Editor
# Run in order:
# 1. scripts/setup-database.sql
# 2. scripts/deploy-production-matchmaking.sql
# 3. scripts/add-age-verification-FIXED.sql
# 4. scripts/add-report-system.sql

# 4. Start Dev Server
npm run dev
# Open http://localhost:3000
```

---

## 📂 KEY FILES (Where to Find Things)

### Core Features
```
Matchmaking:
  - hooks/useMatchmaking.ts          # State machine
  - app/api/matching/join/route.ts   # Join queue
  - scripts/deploy-production-matchmaking.sql  # DB functions

Video Calls:
  - hooks/useWebRTC.ts               # WebRTC logic
  - app/(authenticated)/chat/page.tsx  # Video UI
  - app/api/livekit/token/route.ts   # Access tokens

Sangha (Communities):
  - app/(authenticated)/sangha/layout.tsx  # Server rail
  - components/sangha/RoomSidebar.tsx     # Channel list
  - components/sangha/RoomChatArea.tsx    # Chat UI

Safety:
  - app/api/verify-age/route.ts      # Age verification
  - app/api/reports/route.ts         # Report system
  - components/AgeVerificationModal.tsx  # Age modal

Database:
  - lib/supabase/client.ts           # Client-side
  - lib/supabase/server.ts           # Server-side
  - scripts/*.sql                    # Migrations
```

### Configuration
```
Environment:
  - .env.local                       # Local secrets
  - .env.example                     # Template

Build:
  - next.config.js                   # Next.js config
  - tailwind.config.js               # Tailwind config
  - tsconfig.json                    # TypeScript config

Deployment:
  - vercel.json                      # Vercel settings
  - package.json                     # Dependencies
```

---

## 🗄️ DATABASE QUICK REFERENCE

### Most Important Tables
```sql
-- Users & Auth
profiles (id, username, avatar_url, xp, level, is_verified, age_verified)

-- Matchmaking
waiting_queue (user_id, match_mode, joined_at)
chat_sessions (user1_id, user2_id, status, started_at, ended_at)

-- Messaging
dm_conversations (user1_id, user2_id)
dm_messages (conversation_id, sender_id, content, type)
room_messages (channel_id, sender_id, content, type)

-- Communities
rooms (id, name, icon_url, created_by)
channels (room_id, name, type, position)
room_participants (user_id, room_id, role)

-- Safety
user_reports (reporter_id, reported_user_id, reason)
user_bans (user_id, banned_until, reason)
age_verification_logs (user_id, date_of_birth, verified_at)
```

### Common Queries
```sql
-- Get user profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Get active chat session
SELECT * FROM chat_sessions 
WHERE (user1_id = auth.uid() OR user2_id = auth.uid()) 
AND status = 'active';

-- Get DM messages
SELECT * FROM dm_messages 
WHERE conversation_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 50;

-- Check if user is banned
SELECT * FROM user_bans 
WHERE user_id = auth.uid() 
AND banned_until > NOW();

-- Get waiting queue count
SELECT COUNT(*) FROM waiting_queue;
```

### Database Functions (RPC)
```typescript
// Find match
const { data } = await supabase.rpc('find_match', {
  p_user_id: userId,
  p_match_mode: 'buddies_first'
});

// Skip partner
const { data } = await supabase.rpc('skip_partner', {
  p_user_id: userId,
  p_session_id: sessionId
});

// Cleanup queue
const { data } = await supabase.rpc('cleanup_matchmaking');
```

---

## 🔌 API ENDPOINTS CHEAT SHEET

### Authentication
```typescript
POST /api/auth/signup
Body: { email, password, username }

POST /api/auth/login
Body: { email, password }
```

### Matchmaking
```typescript
POST /api/matching/join
Body: { matchMode: 'buddies_first' | 'global' }

POST /api/matching/skip
Body: { sessionId }

GET /api/matching/status
Returns: { status, sessionId, partnerId }
```

### Verification
```typescript
POST /api/verify-age
Body: { date_of_birth: 'YYYY-MM-DD' }
Returns: { verified: boolean, age: number }

GET /api/verification/status
Returns: { is_verified: boolean, missing_requirements: string[] }
```

### Reports
```typescript
POST /api/reports
Body: { reported_id, reason, description, session_id }
Returns: { success: boolean, user_banned: boolean }

GET /api/reports
Returns: { is_banned: boolean, ban_details: {...} }
```

### LiveKit (Video)
```typescript
POST /api/livekit/token
Body: { roomName, username }
Returns: { token: string }

GET /api/livekit/participants?roomName=xxx
Returns: { participants: [...] }
```

---

## 🎨 UI COMPONENTS CHEAT SHEET

### Radix UI Primitives
```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
```

### Custom Components
```typescript
import { MessageList } from '@/components/MessageList';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import { AgeVerificationModal } from '@/components/AgeVerificationModal';
import { ReportModal } from '@/components/ReportModal';
import { RoomSidebar } from '@/components/sangha/RoomSidebar';
import { ServerSettingsModal } from '@/components/sangha/ServerSettingsModal';
```

### Hooks
```typescript
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { useBanCheck } from '@/hooks/useBanCheck';
import { useVerificationGate } from '@/hooks/useVerificationGate';
import { useSound } from '@/hooks/useSound';
```

---

## 🎯 COMMON TASKS

### Add a New API Route
```typescript
// 1. Create file: app/api/your-endpoint/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  
  // Your logic here
  
  return Response.json({ success: true });
}

// 2. Test: curl -X POST http://localhost:3000/api/your-endpoint
```

### Add a New Database Table
```sql
-- 1. Create migration: scripts/add-your-feature.sql
CREATE TABLE your_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add index
CREATE INDEX idx_your_table_user_id ON your_table(user_id);

-- 3. Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 4. Add policy
CREATE POLICY "Users can view own rows" ON your_table
  FOR SELECT USING (user_id = auth.uid());

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;

-- 6. Run in Supabase SQL Editor
```

### Add a New React Component
```typescript
// 1. Create file: components/YourComponent.tsx
'use client';

import { useState } from 'react';

interface YourComponentProps {
  title: string;
}

export function YourComponent({ title }: YourComponentProps) {
  const [state, setState] = useState('');
  
  return (
    <div className="p-4 bg-stone-900 rounded-lg">
      <h2 className="text-xl font-bold">{title}</h2>
      {/* Your UI */}
    </div>
  );
}

// 2. Use in page:
import { YourComponent } from '@/components/YourComponent';

export default function Page() {
  return <YourComponent title="Hello" />;
}
```

---

## 🐛 DEBUGGING TIPS

### Check Logs
```bash
# Vercel logs (production)
vercel logs

# Supabase logs (database)
# Go to: Supabase Dashboard > Logs > Database

# Browser console (client-side)
# Open DevTools > Console

# Server logs (local)
# Check terminal running `npm run dev`
```

### Common Errors

#### "User not found"
```typescript
// Check auth status
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check RLS policies
// Go to: Supabase Dashboard > Authentication > Policies
```

#### "Match not found"
```typescript
// Check waiting queue
const { data } = await supabase.from('waiting_queue').select('*');
console.log('Queue:', data);

// Check chat sessions
const { data: sessions } = await supabase.from('chat_sessions')
  .select('*')
  .eq('status', 'active');
console.log('Active sessions:', sessions);
```

#### "Video not connecting"
```typescript
// Check WebRTC config
console.log('RTC Config:', RTC_CONFIG);

// Check ICE candidates
peerConnection.onicecandidate = (event) => {
  console.log('ICE Candidate:', event.candidate);
};

// Check connection state
peerConnection.onconnectionstatechange = () => {
  console.log('Connection State:', peerConnection.connectionState);
};
```

#### "Database error"
```sql
-- Check table exists
SELECT * FROM information_schema.tables WHERE table_name = 'your_table';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check permissions
SELECT * FROM information_schema.role_table_grants WHERE table_name = 'your_table';
```

---

## 🔒 SECURITY CHECKLIST

### Before Deploying
- [ ] All API routes check `auth.uid()`
- [ ] All tables have RLS enabled
- [ ] All sensitive data in environment variables (not committed)
- [ ] Rate limiting on public endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (use DOMPurify)
- [ ] CSRF protection (check origin header)

### Environment Variables (Never Commit!)
```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # NEVER expose to client!
LIVEKIT_API_KEY=APIxxx
LIVEKIT_API_SECRET=xxx  # NEVER expose to client!
NEXT_PUBLIC_LIVEKIT_URL=wss://xxx.livekit.cloud

# Vercel (production)
# Add via: Vercel Dashboard > Settings > Environment Variables
```

---

## 📊 MONITORING & ALERTS

### Health Checks
```bash
# API health
curl https://your-app.vercel.app/api/health

# Database health
# Supabase Dashboard > Database > Health

# Realtime health
# Supabase Dashboard > Realtime > Status
```

### Key Metrics to Watch
```
- Active users (Supabase Dashboard > Authentication)
- Database connections (Supabase Dashboard > Database > Connections)
- API response time (Vercel Dashboard > Analytics)
- Error rate (Sentry Dashboard)
- Queue length (SELECT COUNT(*) FROM waiting_queue)
- Active sessions (SELECT COUNT(*) FROM chat_sessions WHERE status = 'active')
```

---

## 🚨 EMERGENCY PROCEDURES

### Site Down
1. Check Vercel status: https://vercel.com/status
2. Check Supabase status: https://status.supabase.com
3. Check recent deployments: `vercel logs`
4. Rollback if needed: Vercel Dashboard > Deployments > Redeploy previous

### Database Issues
1. Check connection count: Supabase Dashboard > Database > Connections
2. Check slow queries: Supabase Dashboard > Database > Query Performance
3. Kill long-running queries: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...`
4. Restart database: Supabase Dashboard > Database > Restart (last resort)

### Video Issues
1. Check LiveKit status: https://status.livekit.io
2. Check token generation: `POST /api/livekit/token`
3. Check TURN server: Test with https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
4. Check browser console for WebRTC errors

---

## 📞 SUPPORT CONTACTS

### Services
- **Vercel:** support@vercel.com
- **Supabase:** support@supabase.com
- **LiveKit:** support@livekit.io
- **Sentry:** support@sentry.io

### Documentation
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **LiveKit:** https://docs.livekit.io
- **Radix UI:** https://radix-ui.com/docs

### Community
- **Discord:** (Add your server)
- **GitHub Issues:** (Add your repo)
- **Stack Overflow:** Tag with `gurukul` or `chitchat`

---

## 🎓 LEARNING RESOURCES

### For New Developers
1. Read `README.md` (project overview)
2. Read `Guide.md` (detailed walkthrough)
3. Read `TECHNICAL_ARCHITECTURE.md` (system design)
4. Read `COMPREHENSIVE_CODEBASE_ANALYSIS.md` (this analysis)
5. Read `ACTION_PLAN_PRIORITY.md` (what to do next)

### Video Tutorials
- Next.js App Router: https://www.youtube.com/watch?v=...
- Supabase Tutorial: https://www.youtube.com/watch?v=...
- LiveKit WebRTC: https://www.youtube.com/watch?v=...

### Code Examples
- Matchmaking: `hooks/useMatchmaking.ts`
- WebRTC: `hooks/useWebRTC.ts`
- Realtime: `components/MessageList.tsx`
- Auth: `app/api/auth/*/route.ts`

---

**Last Updated:** December 16, 2025  
**Maintained By:** Development Team  
**Questions?** Open an issue or ask in Discord
