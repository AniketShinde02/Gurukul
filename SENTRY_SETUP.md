# Sentry Error Tracking Setup Guide

## ✅ Installation Complete!

Sentry is configured and ready to use. Just add your DSN to start tracking errors.

---

## 🔑 Get Your Sentry DSN

1. Go to https://sentry.io (sign up free if needed)
2. Create new project → Select "Next.js"
3. Copy your DSN (looks like: `https://abc123@o123.ingest.sentry.io/456789`)

---

## 📝 Add to Environment Variables

### Local (`.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
```

### Vercel (Production):
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   - **Key:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** Your DSN from Sentry
   - **Scope:** Production, Preview, Development
3. Redeploy

---

## 🧪 Test It Works

### Local Testing (Disabled by default):
Sentry is disabled on localhost to avoid noise. To test locally, temporarily comment out line 14 in `sentry.client.config.ts`:
```typescript
// enabled: process.env.NODE_ENV === 'production',  // Comment this out to test locally
```

Then trigger an error:
```typescript
throw new Error('Test Sentry error tracking')
```

### Production Testing:
1. Deploy to Vercel
2. Visit your site
3. Trigger an error (e.g., click a broken link)
4. Check Sentry dashboard → Issues

---

## 📊 What Sentry Tracks

### Automatically Captured:
- ✅ Unhandled exceptions
- ✅ Promise rejections
- ✅ API errors
- ✅ React component errors
- ✅ Performance metrics (10% sample)

### Ignored (To Reduce Noise):
- ❌ Localhost errors
- ❌ Browser extension errors
- ❌ Network errors (user's connection)
- ❌ WebSocket disconnects (normal when user leaves)

---

## 🎯 Usage in Code

### Manual Error Capture:
```typescript
import * as Sentry from '@sentry/nextjs'

try {
  // Your code
} catch (error) {
  Sentry.captureException(error)
  // Handle error
}
```

### Add Context:
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
})

Sentry.setTag('page', 'room-chat')
Sentry.addBreadcrumb({
  message: 'User joined voice channel',
  level: 'info'
})
```

### Performance Tracking:
```typescript
const transaction = Sentry.startTransaction({ name: 'Load Room Data' })
// Your code
transaction.finish()
```

---

## 🚨 Critical Errors to Monitor

1. **LiveKit Token Failures**
   - Check if users can't join voice
   
2. **WebSocket Disconnects**
   - Matchmaking server down?
   
3. **Database Errors**
   - Supabase RLS blocking queries?
   
4. **Rate Limit Exceeded**
   - Are users hitting limits?

---

## 💰 Free Tier Limits

**Sentry Free:**
- 5,000 errors/month
- 10,000 performance transactions/month
- 1 GB attachments

**With ~100 users:**
- Expected errors: <100/month (with good code)
- Performance tracking: ~3,000/month (10% sample)
- **Should stay free!** ✅

---

## 📧 Alerts Setup

In Sentry dashboard:
1. Project Settings → Alerts
2. Create alert:
   - **Trigger:** "Error count > 10 in 1 hour"
   - **Action:** Email you
3. Save

---

## ✅ Checklist

- [ ] Sign up for Sentry.io
- [ ] Create Next.js project
- [ ] Copy DSN
- [ ] Add to Vercel environment variables
- [ ] Redeploy
- [ ] Test in production
- [ ] Set up email alerts

---

**Status:** ✅ Code ready, waiting for Sentry DSN

**Next:** Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel and redeploy!
