# 🧪 TESTING GUIDE - Age Verification & Reports

**Date:** 2025-12-14 21:20 IST
**Status:** Ready to Test!

---

## ✅ WHAT'S READY

### 1. Age Verification System ✅
- SQL migration ran successfully
- API routes created
- Modal component ready
- Hook for status checking
- Age gate component

### 2. Report System ✅
- Report button in video controls
- Report modal with 6 reasons
- Auto-ban after 3 reports
- Screenshot capture library (ready to integrate)

---

## 🧪 TEST AGE VERIFICATION

### Step 1: Check API
```javascript
// In browser console
fetch('/api/verify-age')
.then(r => r.json())
.then(console.log)

// Should return: { age_verified: false, has_dob: false, ... }
```

### Step 2: Test Verification
```javascript
// Submit DOB (18+ years old)
fetch('/api/verify-age', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        date_of_birth: '2000-01-01' // 24 years old
    })
})
.then(r => r.json())
.then(console.log)

// Should return: { verified: true, age: 24, ... }
```

### Step 3: Test Underage Rejection
```javascript
// Submit DOB (under 18)
fetch('/api/verify-age', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        date_of_birth: '2010-01-01' // 14 years old
    })
})
.then(r => r.json())
.then(console.log)

// Should return: { verified: false, message: 'Must be 18+' }
```

---

## 🧪 TEST REPORT SYSTEM

### Step 1: Start Video Call
1. Go to Study Lounge
2. Start matching
3. Connect with someone

### Step 2: Check Report Button
1. Look for **Flag icon** in video controls (bottom center)
2. Should be visible during active call
3. Click it → Report modal opens

### Step 3: Submit Report
1. Select a reason (e.g., "Spam")
2. Add description (optional)
3. Click "Submit Report"
4. Should see success message

---

**Both systems are ready to test!** 🎉
