# Age Verification Return URL Fix

## Problem
After completing age verification, users were always redirected to the home page (`/sangha`) instead of being returned to the page they were trying to access when they were blocked.

## Solution
Implemented a `returnUrl` query parameter system that:
1. Captures the current URL when a user is blocked for verification
2. Passes it as a query parameter to the `/verify` page
3. Redirects the user back to their original destination after successful verification

## Changes Made

### 1. `hooks/useVerificationGate.ts`
- Added `returnUrl` parameter to all verification redirects
- Captures current pathname and search params using `window.location`
- Encodes the URL to safely pass it as a query parameter

**Example:**
```typescript
const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
router.push(`/verify?step=age&returnUrl=${returnUrl}`)
```

### 2. `app/verify/page.tsx`
- Updated to read `returnUrl` from query parameters
- Redirects to the original page after successful verification
- Falls back to `/sangha` if no returnUrl is provided

**Key changes:**
- `handleAgeVerified()` - Redirects to returnUrl after age verification
- Initial `useEffect` - Redirects to returnUrl if already verified
- Continue button - Uses returnUrl for navigation

### 3. `components/VerificationGate.tsx`
- Updated to include `returnUrl` when redirecting unverified users
- Ensures users blocked by the gate component also get returned to their original page

## User Flow

### Before Fix:
1. User tries to access `/sangha/study-match`
2. Gets blocked for age verification
3. Completes verification
4. **Redirected to `/sangha` (home page)** ❌

### After Fix:
1. User tries to access `/sangha/study-match`
2. Gets blocked for age verification → redirected to `/verify?step=age&returnUrl=%2Fsangha%2Fstudy-match`
3. Completes verification
4. **Redirected back to `/sangha/study-match`** ✅

## Testing
To test this fix:
1. Clear your age verification (or use a new account)
2. Navigate to a protected page (e.g., `/sangha/study-match`)
3. Complete age verification
4. Verify you're returned to the study match page, not the home page

## Security Note
The `returnUrl` is URL-encoded to prevent injection attacks and is only used for client-side navigation within the app.
