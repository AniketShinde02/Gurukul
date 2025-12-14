# 🔧 COMPREHENSIVE FIX PLAN

## Issues to Fix:

### 1. Missing Report Button ❌
**Problem:** Flag icon not visible in video call controls
**Location:** `components/chat/Controls.tsx`
**Fix:** Ensure report button is always visible when partner is connected

### 2. Verification Gate Not Enforced ❌
**Problem:** New users can access Study Match/Sangha without verification
**Fix:** Add middleware/guard to block unverified users

### 3. Deprecate /verify Route ⏳
**Problem:** Standalone verification page is redundant
**Fix:** Handle verification at registration only

### 4. Single-Pass Verification ✅
**Solution:** Enforce at registration, never ask again

---

## Implementation Plan:

### Step 1: Fix Report Button
- Check Controls.tsx for report button
- Ensure partnerId is passed correctly
- Make button always visible during call

### Step 2: Add Verification Middleware
- Create middleware to check verification before accessing protected routes
- Block /sangha and /study-match for unverified users
- Redirect to complete verification

### Step 3: Registration Flow
- Add age verification modal at signup
- Add Terms & Conditions acceptance
- Mark user as verified after completion

### Step 4: Centralize Safety Logic
- Single hook: `useVerificationCheck()`
- Single middleware: `verificationMiddleware`
- No scattered checks

---

## Files to Modify:

1. `components/chat/Controls.tsx` - Fix report button
2. `middleware.ts` - Add verification check
3. `app/(auth)/signup/page.tsx` - Add verification at signup
4. `app/verify/page.tsx` - Deprecate (redirect to profile)

---

Let me start implementing...
