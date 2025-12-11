# 🚀 QUICK DEPLOYMENT (Fixed)

## Issue Fixed
**Error:** `column "created_at" does not exist`
**Cause:** Schema uses `started_at` not `created_at`
**Status:** ✅ Fixed in new deployment script

---

## Deploy in 2 Minutes

### Step 1: Run SQL (Supabase Dashboard)

1. Go to your Supabase project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy **entire contents** of `scripts/deploy-production-matchmaking.sql`
5. Paste and click **Run**

You should see:
```
✅ PRODUCTION DEPLOYMENT SUCCESSFUL!
Functions created:
  - find_match(user_id, match_mode)
  - skip_partner(user_id, session_id)
  - cleanup_matchmaking()
System ready for 10k+ concurrent users!
```

### Step 2: Deploy Frontend

```bash
# Backup old file
mv app/(authenticated)/chat/page.tsx app/(authenticated)/chat/page.tsx.backup

# Use new production version
mv app/(authenticated)/chat/page-v2-production.tsx app/(authenticated)/chat/page.tsx

# Build and deploy
npm run build
vercel --prod
```

---

## What Was Fixed

1. ✅ `created_at` → `started_at` (matches actual schema)
2. ✅ Added `match_mode` column to `waiting_queue`
3. ✅ Single deployment script (no manual steps)
4. ✅ Proper error messages and notices
5. ✅ Idempotent (safe to run multiple times)

---

## Test After Deployment

1. **Open app** → Click "Find Partner"
2. **Loader should spin smoothly** (not stuck)
3. **Match should connect** (both users)
4. **Skip button** should appear in header
5. **No console errors**

---

## If Still Having Issues

Run this diagnostic query:

```sql
-- Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('find_match', 'skip_partner', 'cleanup_matchmaking');

-- Check waiting_queue schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'waiting_queue';

-- Check chat_sessions schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions';
```

Expected output:
- 3 functions (find_match, skip_partner, cleanup_matchmaking)
- waiting_queue has `match_mode` column
- chat_sessions has `started_at` column

---

## Emergency Rollback

If needed:

```bash
# Restore old frontend
mv app/(authenticated)/chat/page.tsx.backup app/(authenticated)/chat/page.tsx

# Restore old SQL
# (Run your original match-function.sql in Supabase)

# Redeploy
npm run build && vercel --prod
```

---

**Ready to deploy!** 🚀
