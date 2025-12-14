# 🎯 VERIFICATION GATE - ARCHITECTURE

**Minimal Complexity | Maximum Robustness**

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                    │
│                                                              │
│  Database: profiles.is_verified (auto-updated by trigger)   │
│            profiles.verification_level                       │
│            check_user_verification() function                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      CENTRALIZED LAYER                       │
│                                                              │
│  Hook: useVerificationGate()                                │
│  API: /api/verification/status                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PROTECTION LAYER                          │
│                                                              │
│  Component: <VerificationGate>                              │
│  Page: /verify (guided flow)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROTECTED FEATURES                         │
│                                                              │
│  • Study Match                                              │
│  • Sangha Rooms                                             │
│  • Random Matching                                          │
│  • Live Interactions                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## USAGE PATTERNS

### Pattern 1: Protect Entire Page (Recommended)
```typescript
// app/sangha/page.tsx
<VerificationGate>
  <SanghaContent />
</VerificationGate>
```

### Pattern 2: Protect Specific Action
```typescript
// Any component
const { requireVerification } = useVerificationGate()

const handleAction = () => {
  if (!requireVerification()) return
  // Do action
}
```

### Pattern 3: Check Status Only
```typescript
const { isVerified, missingRequirements } = useVerificationGate()
```

---

## DATA FLOW

```
User Action
    ↓
useVerificationGate() hook
    ↓
Calls: /api/verification/status
    ↓
Calls: check_user_verification(user_id)
    ↓
Checks: profiles.is_verified
    ↓
Returns: { is_verified, missing_requirements }
    ↓
Hook decides: Allow or Block
    ↓
If Block: Redirect to /verify
If Allow: Continue
```

---

## AUTO-UPDATE FLOW

```
User completes verification (e.g., age)
    ↓
profiles.age_verified = TRUE
    ↓
Trigger: update_verification_status()
    ↓
Calls: check_user_verification()
    ↓
Updates: profiles.is_verified = TRUE
    ↓
All checks now pass automatically
```

---

## ADDING NEW REQUIREMENT

```
1. Add to verification_requirements table
   INSERT INTO verification_requirements (...)

2. Update check_user_verification() function
   Add new check logic

3. Done! Works everywhere automatically
   - Hook picks it up
   - Component shows it
   - API checks it
```

---

## ZERO DUPLICATION

**Before (Complex):**
```
❌ Check in Sangha page
❌ Check in Study Match page
❌ Check in matching button
❌ Check in room join
❌ Check in API routes
❌ Different logic everywhere
```

**After (Simple):**
```
✅ One hook: useVerificationGate()
✅ One component: <VerificationGate>
✅ One function: check_user_verification()
✅ Same logic everywhere
```

---

## GRACEFUL UX

**Not Verified:**
```
User → Clicks Feature
     → Sees: "Verification Required"
     → Redirected to: /verify
     → Shows: Missing requirements
     → Completes: Age verification
     → Auto-redirected back
     → Feature works!
```

**Already Verified:**
```
User → Clicks Feature
     → Feature works immediately
     → No interruption
```

---

**This is the simplest, most robust verification system possible!** 🎯
