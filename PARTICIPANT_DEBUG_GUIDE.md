# 🔧 PARTICIPANT LIST DEBUG GUIDE

**Date**: December 12, 2025  
**Issue**: User 2 (not connected) cannot see User 1 in voice channel  
**Status**: ⏳ DEBUGGING

---

## ✅ **FIXES APPLIED**

### **1. Timer Now Always Visible** ✅
- **Before**: Timer only showed on hover
- **After**: Timer always visible
- **Change**: Removed `opacity-0` class from timer

### **2. Added Debug Logging** ✅
- Console logs show:
  - What room is being fetched
  - What participants are returned
  - Any errors

---

## 🔍 **HOW TO DEBUG**

### **Step 1: Open Browser Console**
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Clear console (click 🚫 icon)

### **Step 2: Test with 2 Users**

**User 1 (Browser 1)**:
1. Open `localhost:3000/sangha/rooms/[roomId]`
2. Join "Study Lounge" voice channel
3. Check console for logs

**User 2 (Browser 2 or Incognito)**:
1. Open same room
2. **DO NOT** join voice
3. Check console for logs

### **Step 3: Check Console Logs**

You should see:
```
🔍 Fetching participants from: General Lounge
👥 Participants received: [...]
```

---

## 🎯 **WHAT TO LOOK FOR**

### **Scenario A: Participants Array is Empty** `[]`
```
🔍 Fetching participants from: General Lounge
👥 Participants received: []
```

**Meaning**: LiveKit room "General Lounge" has no participants

**Possible Causes**:
1. User 1 is joining a DIFFERENT room name
2. LiveKit room name doesn't match
3. User 1 hasn't actually connected yet

**Solution**: Check what room User 1 is actually joining

---

### **Scenario B: Participants Array Has Data**
```
🔍 Fetching participants from: General Lounge
👥 Participants received: [{sid: "...", identity: "ai.captioncraft"}]
```

**Meaning**: API is returning participants correctly!

**Possible Causes**:
1. UI is not rendering them
2. `showParticipants` condition is false

**Solution**: Check line 722 in RoomSidebar.tsx

---

### **Scenario C: Error Fetching**
```
❌ Error fetching participants from General Lounge: ...
```

**Meaning**: API call failed

**Possible Causes**:
1. LiveKit server is down
2. API route has error
3. Network issue

**Solution**: Check LiveKit server status

---

## 🔧 **QUICK FIXES TO TRY**

### **Fix 1: Hard-code Room Name**
If you see User 1 joining a different room, update line 369:

```typescript
// BEFORE:
const roomToFetch = activeCallRoom || 'General Lounge'

// AFTER (use exact room name User 1 joins):
const roomToFetch = activeCallRoom || 'Study Lounge' // or whatever the actual name is
```

### **Fix 2: Always Show Participants (Remove Condition)**
Update line 722:

```typescript
// BEFORE:
const showParticipants = participants.length > 0

// AFTER:
const showParticipants = true // Always show, even if empty (for debugging)
```

### **Fix 3: Add Participant Count to Console**
Add after line 375:

```typescript
console.log('📊 Participants state:', participants)
```

---

## 📋 **CHECKLIST**

Run through this checklist:

- [ ] User 1 successfully joins voice (sees "Voice Connected" box)
- [ ] User 1's console shows they joined "General Lounge"
- [ ] User 2's console shows fetching from "General Lounge"
- [ ] User 2's console shows participants array with User 1's data
- [ ] User 2's sidebar shows "Study Lounge (1)"
- [ ] User 2's sidebar shows User 1's name nested under channel

---

## 🎯 **EXPECTED CONSOLE OUTPUT**

### **User 1 (Connected)**:
```
🔍 Fetching participants from: General Lounge
👥 Participants received: [{sid: "abc123", identity: "ai.captioncraft"}]
```

### **User 2 (Not Connected)**:
```
🔍 Fetching participants from: General Lounge
👥 Participants received: [{sid: "abc123", identity: "ai.captioncraft"}]
```

**Both should see the SAME data!**

---

## 🚨 **COMMON ISSUES**

### **Issue 1: Room Name Mismatch**
- User 1 joins "Study Lounge"
- But LiveKit creates room "General Lounge"
- User 2 fetches from "General Lounge" ✅
- **This should work!**

### **Issue 2: Multiple Rooms**
- There might be multiple voice channels
- Each creates a different LiveKit room
- User 2 is fetching from wrong room

**Solution**: Make sure both users are looking at the SAME voice channel

### **Issue 3: Polling Not Running**
- Check if console logs appear every 5 seconds
- If not, the useEffect might not be running

**Solution**: Check dependencies in useEffect

---

## 📝 **NEXT STEPS**

1. **Open console in both browsers**
2. **User 1 joins voice**
3. **Check User 2's console logs**
4. **Report what you see**:
   - Is participants array empty or has data?
   - Any errors?
   - What room name is being fetched?

---

## 🎉 **WHEN IT WORKS**

You should see:

**User 2's Sidebar**:
```
VOICE CHANNELS
  🔊 Study Lounge (1)
     👤 ai.captioncraft  2:34  🟢
```

**User 2's Console**:
```
🔍 Fetching participants from: General Lounge
👥 Participants received: [{sid: "abc123", identity: "ai.captioncraft"}]
```

---

**Status**: ⏳ AWAITING DEBUG INFO  
**Next**: Check console logs and report findings
