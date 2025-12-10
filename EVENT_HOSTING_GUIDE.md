# 🎉 Event Lifecycle System - Complete Guide

## 📋 What You Need to Do to Host an Event

### Step 1: Run the SQL Script
**Go to Supabase Dashboard → SQL Editor and run:**
```sql
-- Copy from: d:\Chitchat\scripts\enhance-events-lifecycle.sql
```

This creates:
- `channel_id` field in `room_events` (links event to voice/video channel)
- `room_event_participants` table (tracks who's attending)
- Proper RLS policies for security

---

### Step 2: Create an Event
1. **Open your server**
2. **Click the dropdown** next to server name → "Create Channel"
3. **Switch to "Event" tab**
4. **Fill in the details:**
   - **Event Name**: e.g., "Weekly Study Session"
   - **Description**: What's it about?
   - **Start Time**: When it begins
   - **End Time** (optional): When it ends
   - **Channel** (optional): Link to a voice/video channel

5. **Click "Create Event"**

---

### Step 3: Event Goes Live
**When the start time arrives:**
- Event automatically moves to **"🔴 LIVE EVENTS"** section at TOP
- Shows **pulsing "LIVE" badge**
- Displays **participant count**
- Members can **click to join**

---

### Step 4: Members Join
**When someone clicks the event:**
- They're added to `room_event_participants` table
- If event has a linked channel → **auto-opens that channel**
- Participant count updates in real-time
- Toast notification: "Joined [Event Name]!"

---

### Step 5: Event Ends
**After the end time:**
- Event moves to **"Past Events"** section (collapsible)
- Shows attendance stats
- Grayed out (can't join)
- Admins can still delete if needed

---

## 🎯 Event Lifecycle States

### 1. **📅 Upcoming** (Before start_time)
- Shows in "Upcoming Events" section
- Orange card with calendar icon
- Click → Mark as "Interested" (adds to participants)
- Shows participant count

### 2. **🔴 Active/Live** (During event)
- **Moves to TOP** of sidebar
- **Red "LIVE" badge** (pulsing animation)
- **Orange glowing border**
- **"Click to join →" button**
- Shows real-time participant count
- Click → Opens linked channel + marks attendance

### 3. **✅ Past** (After end_time)
- Moves to "Past Events" (collapsed by default)
- Grayed out, can't join
- Shows final attendance count
- Click header to expand/collapse
- Shows last 5 past events

---

## 💡 Best Practices for Hosting

### Link Events to Channels
**Why?** When members join, they're automatically taken to the right place!

**How?**
1. Create a voice/video channel first (e.g., "study-lounge")
2. When creating event, select that channel
3. When event goes live → clicking joins that channel

### Set Clear Times
- **Start Time**: When you'll actually be there
- **End Time**: When it wraps up (helps auto-archive)
- No end time? Event stays "active" until you delete it

### Write Good Descriptions
- What's the topic?
- Who should attend?
- What to bring/prepare?
- Any prerequisites?

---

## 🚀 Advanced Features

### Track Attendance
```sql
-- See who attended an event
SELECT p.username, ep.joined_at
FROM room_event_participants ep
JOIN profiles p ON p.id = ep.user_id
WHERE ep.event_id = 'your-event-id'
AND ep.left_at IS NULL;
```

### Recurring Events
(Future feature - database already supports it!)
- Set `is_recurring = true`
- Add `recurrence_rule` (RRULE format)
- Auto-creates next occurrence

### Event Cover Images
(Future feature - database ready!)
- Add `cover_image_url` to make events pop
- Upload to Supabase Storage
- Shows in event card

---

## 🎨 UI Features

### Active Events
- **Position**: Always at top
- **Badge**: Red "LIVE" with radio icon
- **Animation**: Pulsing glow
- **Border**: Orange with shadow
- **Action**: Click to join

### Upcoming Events
- **Position**: Middle section
- **Badge**: 📅 calendar emoji
- **Color**: Orange theme
- **Action**: Click to mark interested

### Past Events
- **Position**: Bottom (collapsible)
- **Badge**: Chevron (expand/collapse)
- **Color**: Grayed out
- **Limit**: Shows last 5
- **Action**: Click header to toggle

---

## 🔧 Troubleshooting

### Event not showing as LIVE?
- Check system time is correct
- Verify `start_time` is in the past
- Refresh the page (events update every 30s)

### Can't join event?
- Check you're a server member
- Verify event has a linked channel
- Check channel permissions

### Participant count not updating?
- Wait a few seconds (realtime sync)
- Refresh if needed
- Check Supabase realtime is enabled

---

## 📊 Database Schema

### room_events
```sql
- id: UUID
- room_id: UUID (which server)
- name: TEXT (event title)
- description: TEXT (what's it about)
- start_time: TIMESTAMP (when it starts)
- end_time: TIMESTAMP (when it ends)
- channel_id: UUID (linked voice/video channel)
- created_by: UUID (who created it)
- is_recurring: BOOLEAN (future feature)
- recurrence_rule: TEXT (future feature)
- max_participants: INTEGER (future feature)
- cover_image_url: TEXT (future feature)
```

### room_event_participants
```sql
- id: UUID
- event_id: UUID (which event)
- user_id: UUID (who's attending)
- joined_at: TIMESTAMP (when they joined)
- left_at: TIMESTAMP (when they left, null = still there)
```

---

## 🎯 Quick Start Checklist

- [ ] Run SQL script (`enhance-events-lifecycle.sql`)
- [ ] Create a voice/video channel for events
- [ ] Create your first event
- [ ] Link it to the channel
- [ ] Set start/end times
- [ ] Wait for start time or manually test
- [ ] Click to join when live
- [ ] Check participant count updates
- [ ] Verify it moves to "Past Events" after end time

---

## 🚀 You're All Set!

Your event system is now fully functional with:
- ✅ 3-state lifecycle (Upcoming/Active/Past)
- ✅ Real-time participant tracking
- ✅ Auto-channel joining
- ✅ Beautiful status-based UI
- ✅ Attendance analytics ready
- ✅ Future-proof for recurring events

**Go create your first event and watch it come alive! 🎉**
