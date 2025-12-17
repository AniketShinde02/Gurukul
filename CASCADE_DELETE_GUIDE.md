# 🗑️ CASCADE DELETE SETUP - Complete User Data Cleanup

**Date:** December 16, 2025  
**Purpose:** Automatically delete ALL user data when deleting user from Supabase Auth

---

## 🎯 PROBLEM

When you delete a user from **Supabase Dashboard → Authentication → Users**, the user is removed from `auth.users` but their data remains in:
- `profiles` table
- `chat_sessions` table
- `messages` table
- `waiting_queue` table
- `reports` table
- `server_members` table
- `servers` table

This causes issues when trying to sign up again with the same email.

---

## ✅ SOLUTION

We've created a **database trigger** that automatically deletes all user data when the auth user is deleted.

---

## 📝 SETUP INSTRUCTIONS

### Step 1: Run CASCADE DELETE Trigger
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Run: scripts/cascade-delete-user.sql
```

This creates a trigger on `auth.users` that runs AFTER a user is deleted.

### Step 2: Ensure Foreign Key Constraints
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Run: scripts/ensure-cascade-delete.sql
```

This updates all foreign keys to use `ON DELETE CASCADE`.

---

## 🔧 HOW IT WORKS

### When you delete a user from Supabase Auth:

```
1. User deleted from auth.users
   ↓
2. Trigger fires: handle_user_delete()
   ↓
3. Deletes from profiles table
   ↓
4. CASCADE deletes from all related tables:
   - chat_sessions (where user1_id or user2_id)
   - messages (where sender_id)
   - waiting_queue (where user_id)
   - reports (where reporter_id or reported_user_id)
   - server_members (where user_id)
   - servers (where owner_id)
   ↓
5. ✅ ALL user data completely removed
```

---

## 🧪 TESTING

### Test the CASCADE DELETE:

1. **Create a test user:**
   - Sign up with email: `test123@tempmail.com`
   - Complete profile
   - Create some data (messages, join servers, etc.)

2. **Delete the user:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find the test user
   - Click "..." → Delete User
   - Confirm deletion

3. **Verify data is gone:**
   ```sql
   -- Run in Supabase SQL Editor
   -- Replace 'USER_ID' with the deleted user's ID
   
   SELECT * FROM profiles WHERE id = 'USER_ID';
   -- Should return 0 rows
   
   SELECT * FROM messages WHERE sender_id = 'USER_ID';
   -- Should return 0 rows
   
   SELECT * FROM chat_sessions WHERE user1_id = 'USER_ID' OR user2_id = 'USER_ID';
   -- Should return 0 rows
   ```

4. **Try signing up again:**
   - Use the same email: `test123@tempmail.com`
   - Should work perfectly!
   - Verification email should arrive

---

## 🔍 VERIFY TRIGGER IS ACTIVE

Run this query in Supabase SQL Editor:

```sql
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_deleted';
```

**Expected Result:**
```
trigger_name: on_auth_user_deleted
event_manipulation: DELETE
event_object_table: users
action_statement: EXECUTE FUNCTION public.handle_user_delete()
```

---

## 🔍 VERIFY CASCADE CONSTRAINTS

Run this query to check all foreign keys:

```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'profiles';
```

**All should show:** `delete_rule: CASCADE`

---

## ⚠️ IMPORTANT NOTES

### 1. This is PERMANENT
Once a user is deleted, **ALL their data is gone forever**. There's no undo!

### 2. Production Use
In production, you might want to:
- **Soft delete** instead (add `deleted_at` column)
- **Archive data** before deletion
- **Require confirmation** from admin

### 3. GDPR Compliance
This CASCADE DELETE is actually **GOOD for GDPR** because it ensures complete data removal when users request account deletion.

---

## 🎯 FOR YOUR TESTING NOW

Since you already have the Google Auth account in the database:

### Option 1: Delete and Re-test (Recommended)
```
1. Go to Supabase → Authentication → Users
2. Delete the Google account
3. Run the CASCADE DELETE scripts (if not already done)
4. Try signing up with the same email
5. Should work perfectly now!
```

### Option 2: Use Temp Mail (Quick)
```
1. Go to https://temp-mail.org/
2. Copy the temp email
3. Sign up with that email
4. Check temp mail for verification
5. Test onboarding flow
```

### Option 3: Use Gmail + Trick
```
Use: youremail+test1@gmail.com
     youremail+test2@gmail.com
     youremail+test3@gmail.com

All emails go to youremail@gmail.com
But Supabase treats them as different!
```

---

## 📊 TABLES AFFECTED

When a user is deleted, these tables are cleaned:

| Table | Deletion Method | Notes |
|-------|----------------|-------|
| `auth.users` | Manual (by you) | Triggers everything |
| `profiles` | Trigger | Deleted first |
| `chat_sessions` | CASCADE | Via foreign key |
| `messages` | CASCADE | Via foreign key |
| `waiting_queue` | CASCADE | Via foreign key |
| `reports` | CASCADE | Via foreign key |
| `server_members` | CASCADE | Via foreign key |
| `servers` | CASCADE | If user is owner |

---

## 🚀 DEPLOYMENT

### For Production:

1. **Run both SQL scripts** in Supabase
2. **Test thoroughly** with test accounts
3. **Document** for your team
4. **Add UI** for users to delete their own account (optional)

### Optional: User Self-Delete API

Want users to delete their own account from the app?

Let me know and I'll create:
- `/api/delete-account` endpoint
- Confirmation modal
- Complete data cleanup

---

## ✅ CHECKLIST

- [ ] Run `cascade-delete-user.sql`
- [ ] Run `ensure-cascade-delete.sql`
- [ ] Verify trigger exists
- [ ] Verify CASCADE constraints
- [ ] Test with a dummy account
- [ ] Delete dummy account
- [ ] Verify all data gone
- [ ] Try signing up again with same email
- [ ] Confirm it works!

---

## 📞 TROUBLESHOOTING

### Issue: Trigger not firing
**Solution:** Check permissions
```sql
GRANT USAGE ON SCHEMA auth TO postgres, service_role;
GRANT ALL ON auth.users TO postgres, service_role;
```

### Issue: Foreign key errors
**Solution:** Run `ensure-cascade-delete.sql` again

### Issue: Data still remains
**Solution:** Check RLS policies aren't blocking deletion

---

**Bhai, ab ye setup kar lo! Phir test karo!** 🚀

**Steps:**
1. Go to Supabase SQL Editor
2. Run `cascade-delete-user.sql`
3. Run `ensure-cascade-delete.sql`
4. Delete your test user
5. Try signing up again!

**It will work perfectly!** ✨
