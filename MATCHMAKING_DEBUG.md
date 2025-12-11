# 🔍 MATCHMAKING NOT CONNECTING - DEBUG GUIDE

## Issue
Both tabs stuck in "Finding a Partner..." state, sound stopped, no connection.

## Root Cause
The `find_match` RPC function is likely failing silently.

---

## ✅ Quick Diagnosis (2 Minutes)

### Step 1: Open Diagnostic Page
1. Go to: **http://localhost:3000/diagnostic**
2. Click **"Test find_match RPC"**
3. Check the result

### Step 2: Check Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for errors like:
   ```
   [Matchmaking] Start error: function find_match does not exist
   ```

---

## 🐛 Common Errors & Fixes

### Error 1: "function find_match does not exist"
**Cause**: SQL script wasn't run in Supabase

**Fix**:
1. Open **Supabase Dashboard** → **SQL Editor**
2. Run `scripts/deploy-production-matchmaking.sql`
3. Wait for success message
4. Refresh browser and try again

### Error 2: "column match_mode does not exist"
**Cause**: `waiting_queue` table missing column

**Fix**: Already handled in deployment script, but verify:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'waiting_queue';
```

Should show: `id`, `user_id`, `joined_at`, `preferences`, `match_mode`

### Error 3: "permission denied for function find_match"
**Cause**: Function not granted to authenticated users

**Fix**: Run in Supabase SQL Editor:
```sql
GRANT EXECUTE ON FUNCTION public.find_match(UUID, TEXT) TO authenticated;
```

### Error 4: No error, just stuck
**Cause**: Realtime subscription not working

**Fix**: Check Supabase Dashboard → Database → Replication
- Ensure `chat_sessions` table has replication enabled

---

## 🧪 Manual Test (Verify SQL Function)

Run this in **Supabase SQL Editor**:

```sql
-- Test the function directly
SELECT * FROM find_match(
    'YOUR_USER_ID_HERE'::UUID,
    'global'::TEXT
);
```

**Expected Result**:
```
match_found | session_id | partner_id | message
false       | null       | null       | Queued
```

If you get an error, the function isn't deployed correctly.

---

## 🔧 Complete Fix (If Function Missing)

### Option 1: Run Deployment Script Again
```bash
# In Supabase SQL Editor, paste entire contents of:
scripts/deploy-production-matchmaking.sql
```

### Option 2: Verify Function Exists
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'find_match';
```

**Expected**: Should return 1 row with `find_match` function

---

## 📊 What Should Happen (Normal Flow)

1. **User clicks "Find Partner"**
   - `useMatchmaking` hook calls `supabase.rpc('find_match')`
   - Sound starts playing (looping)

2. **First Call**
   - If no match: User added to `waiting_queue`
   - Returns: `{ match_found: false, message: 'Queued' }`

3. **Realtime Subscription**
   - Listens for new rows in `chat_sessions` table
   - When match found, triggers `handleMatchFound()`

4. **Polling (Fallback)**
   - Every 2-8 seconds, calls `find_match` again
   - Checks if partner joined queue

5. **Match Found**
   - Sound stops
   - Status changes to 'connecting'
   - Video call UI appears

---

## 🚨 Emergency: Use Old Code

If new code is broken:

```bash
# Restore backup
Move-Item "app/(authenticated)/chat/page.tsx.backup" "app/(authenticated)/chat/page.tsx" -Force

# Restart dev server
# Ctrl + C, then npm run dev
```

---

## 📝 Checklist

- [ ] SQL script run in Supabase? (`deploy-production-matchmaking.sql`)
- [ ] Function exists? (Check with diagnostic page)
- [ ] Permissions granted? (`GRANT EXECUTE...`)
- [ ] Browser console shows errors? (F12 → Console)
- [ ] Hard refresh done? (Ctrl + Shift + R)

---

## 🎯 Next Steps

1. **Go to**: http://localhost:3000/diagnostic
2. **Click**: "Test find_match RPC"
3. **Check**: Console for errors
4. **Report**: What error you see (if any)

**Most likely issue**: SQL function not deployed to Supabase yet!
