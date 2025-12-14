# 🚨 ENHANCED SAFETY SYSTEM - WITH AUTO-MODERATION

**Date:** 2025-12-14 21:15 IST
**Priority:** CRITICAL
**Status:** Implementation Plan

---

## 🎯 WHAT'S NEEDED

### Current Issues:
1. ❌ Report button not visible during call
2. ❌ No screenshot capture
3. ❌ No auto-moderation
4. ❌ No severity-based actions

### Solution:
1. ✅ Report button always visible in video controls
2. ✅ Auto-capture screenshot when reporting
3. ✅ Free AI moderation (Sightengine free tier)
4. ✅ Severity-based auto-actions (low/med/high)

---

## 🔧 IMPLEMENTATION PLAN

### 1. Fix Report Button Visibility ✅
**Where:** Video call controls
**What:** Make report button always visible during active call

```typescript
// In Controls.tsx - ALREADY DONE!
{partnerId && partnerUsername && (
    <Button onClick={() => setShowReportModal(true)}>
        <Flag /> Report
    </Button>
)}
```

**Status:** ✅ Already implemented, just needs partner info passed

---

### 2. Screenshot Capture 🆕
**API:** Browser Canvas API (built-in, free)
**How:** Capture video frame when report is submitted

```typescript
// Capture screenshot from video element
function captureVideoScreenshot(videoElement: HTMLVideoElement): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(videoElement, 0, 0)
        
        // Convert to base64
        const screenshot = canvas.toDataURL('image/jpeg', 0.8)
        resolve(screenshot)
    })
}
```

**Upload to:** Supabase Storage (`report-screenshots` bucket)

---

### 3. Free Content Moderation APIs 🆕

#### Option 1: Sightengine (RECOMMENDED)
**Free Tier:** 40,000 operations/month, 2 simultaneous video streams
**Features:**
- Nudity detection
- Violence detection
- Offensive gestures
- Weapons detection
- Text moderation

**Pricing:** FREE forever for basic tier
**Signup:** https://sightengine.com/

```typescript
// Sightengine API call
async function moderateImage(imageBase64: string) {
    const formData = new FormData()
    formData.append('media', imageBase64)
    formData.append('models', 'nudity,violence,offensive')
    formData.append('api_user', process.env.SIGHTENGINE_USER)
    formData.append('api_secret', process.env.SIGHTENGINE_SECRET)
    
    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        body: formData
    })
    
    return response.json()
}
```

#### Option 2: OpenAI Moderation API (FREE)
**Free Tier:** Unlimited, completely free
**Features:**
- Text moderation only
- Hate speech
- Harassment
- Sexual content
- Violence

**Use for:** Chat messages, not video

```typescript
async function moderateText(text: string) {
    const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({ input: text })
    })
    
    return response.json()
}
```

---

### 4. Severity-Based Auto-Actions 🆕

#### Severity Levels:
```typescript
enum Severity {
    LOW = 'low',        // Score: 0-30%
    MEDIUM = 'medium',  // Score: 30-70%
    HIGH = 'high',      // Score: 70-100%
    CRITICAL = 'critical' // Confirmed violation
}
```

#### Auto-Actions:
```typescript
const autoActions = {
    LOW: {
        action: 'log',
        message: 'Report submitted for review',
        banDuration: null
    },
    MEDIUM: {
        action: 'warn',
        message: '⚠️ Warning: Inappropriate behavior detected',
        banDuration: null
    },
    HIGH: {
        action: 'temp_ban',
        message: '🚫 You have been temporarily banned for 24 hours',
        banDuration: '24 hours'
    },
    CRITICAL: {
        action: 'perm_ban',
        message: '🚫 You have been permanently banned',
        banDuration: 'permanent'
    }
}
```

---

## 📊 MODERATION FLOW

```
User Reports → Capture Screenshot → Upload to Storage
                                          ↓
                                   Moderate with AI
                                          ↓
                              Calculate Severity Score
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
                    ↓                     ↓                     ↓
                  LOW                  MEDIUM                 HIGH
                    ↓                     ↓                     ↓
            Log for review         Send warning          Auto-ban 24h
                                                               ↓
                                                      Notify admin
```

---

## 🔐 ADMIN REVIEW DASHBOARD

### Features:
1. View all reports with screenshots
2. See AI moderation scores
3. Manual review for edge cases
4. Override auto-actions
5. Ban/unban users
6. View user history

### SQL View:
```sql
CREATE VIEW admin_moderation_dashboard AS
SELECT 
    r.id,
    r.reason,
    r.description,
    r.screenshot_url,
    r.moderation_score,
    r.severity,
    r.auto_action_taken,
    r.created_at,
    reporter.username as reporter,
    reported.username as reported,
    reported.email as reported_email,
    (SELECT COUNT(*) FROM user_reports WHERE reported_id = r.reported_id) as total_reports
FROM user_reports r
JOIN profiles reporter ON r.reporter_id = reporter.id
JOIN profiles reported ON r.reported_id = reported.id
ORDER BY r.created_at DESC;
```

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Add Screenshot Capture (30 min)
1. Create `lib/screenshot.ts`
2. Add capture function
3. Upload to Supabase Storage
4. Save URL in report

### Step 2: Integrate Sightengine (1 hour)
1. Sign up for free account
2. Get API credentials
3. Add to `.env.local`
4. Create moderation function
5. Test with sample images

### Step 3: Update Report System (1 hour)
1. Add screenshot_url to user_reports table
2. Add moderation_score, severity columns
3. Update API route to moderate on submit
4. Implement auto-actions based on severity

### Step 4: Admin Dashboard (2 hours)
1. Create admin page
2. Show reports with screenshots
3. Manual review interface
4. Override actions

---

## 💰 COST ANALYSIS

### Free Tier Limits:
- **Sightengine:** 40,000 ops/month (FREE forever)
- **OpenAI Moderation:** Unlimited (FREE)
- **Supabase Storage:** 1GB (FREE)
- **Canvas API:** Built-in browser (FREE)

### Estimated Usage:
- 1,000 users/month
- 10% report rate = 100 reports
- 100 screenshots + moderation = 100 ops
- **Cost:** $0/month ✅

---

## ⚠️ LEGAL COMPLIANCE

### GDPR:
- ✅ Screenshot only on report (user action)
- ✅ Data minimization (delete after 30 days)
- ✅ User consent (ToS agreement)

### COPPA:
- ✅ Age verification (18+)
- ✅ No data collection from minors

### Platform Safety:
- ✅ Proactive moderation
- ✅ Auto-ban for severe violations
- ✅ Audit trail for compliance

---

## 🎯 NEXT ACTIONS

**Priority 1: Fix Report Button (5 min)**
- Make sure partner info is passed to Controls
- Test button visibility during call

**Priority 2: Screenshot Capture (30 min)**
- Implement capture function
- Upload to Supabase
- Test capture quality

**Priority 3: AI Moderation (1 hour)**
- Sign up for Sightengine
- Integrate API
- Test moderation scores

**Priority 4: Auto-Actions (1 hour)**
- Implement severity logic
- Add auto-ban
- Add user notifications

---

**Total Time:** 3-4 hours
**Impact:** CRITICAL for safety
**Cost:** $0 (all free tiers)

**Ready to implement?** 🚀
