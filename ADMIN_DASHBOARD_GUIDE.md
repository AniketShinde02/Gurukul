# 🛡️ Admin Dashboard - Complete Guide

## Overview

The Admin Dashboard is a comprehensive management interface for monitoring and controlling all aspects of the Gurukul platform. Built with Next.js 13+ App Router, it provides real-time insights, user management, performance monitoring, and system administration tools.

---

## Features

### 1. **Overview Tab**
- Real-time statistics dashboard
- System health monitoring
- Recent activity feed
- Quick stats cards (users, rooms, messages, etc.)

### 2. **Users Management**
- Search users by username, name, or email
- View user details (level, XP, verification status)
- Ban/unban users
- Grant admin privileges
- Filter by status (admin, student, banned)

### 3. **Rooms Management**
- View all study rooms
- Search rooms by name/description
- Delete rooms
- View member counts and activity status
- Quick actions for each room

### 4. **Verifications**
- Review pending ID verification requests
- Approve/reject student verifications
- View uploaded documents
- Integration with existing verification system

### 5. **Performance Monitoring**
- **Redis Metrics:**
  - Commands per day
  - Memory usage
  - Cache hit rates
  - Top keys performance
  
- **Supabase Metrics:**
  - Database size
  - Bandwidth usage
  - Query performance
  
- **LiveKit Metrics:**
  - Monthly minutes used
  - Active calls count
  
- **Vercel Metrics:**
  - Bandwidth usage
  - Average response time
  - Success rate

### 6. **System Logs**
- Real-time log viewer
- Filter by log level (info, warning, error, success)
- Source tracking (LiveKit, Redis, API, Webhook)
- Timestamp and message details

---

## Access Control

### Who Can Access?
- Only users with `is_admin = true` in the `profiles` table
- Automatically redirects non-admins to homepage

### How to Make Someone Admin?
```sql
-- Run in Supabase SQL Editor:
UPDATE profiles 
SET is_admin = true 
WHERE email = 'admin@example.com';
```

**OR use the dashboard itself:**
1. Log in as existing admin
2. Go to Users Management tab
3. Find user → Click "Make Admin"

---

## Usage

### Accessing the Dashboard
```
URL: https://your-domain.com/admin/dashboard
```

### Navigation
- **Overview:** Home dashboard with quick stats
- **Users:** Manage all users
- **Rooms:** Manage all study rooms
- **Verifications:** Review ID requests (links to /admin/verifications)
- **Performance:** Monitor system metrics
- **Logs:** View system activity

### Common Tasks

#### Ban a User
1. Go to "Users" tab
2. Search for user
3. Click "Ban" button
4. Confirm action

#### Delete a Room
1. Go to "Rooms" tab
2. Find room
3. Click delete icon
4. Confirm deletion

#### Review Verification
1. Go to "Verifications" tab
2. Click "Go to Verifications Page"
3. Review submitted document
4. Approve or Reject

#### Monitor Performance
1. Go to "Performance" tab
2. Check usage bars:
   - Green: < 60% (safe)
   - Orange: 60-80% (monitor)
   - Red: > 80% (action needed)

---

## API Routes

### `/api/admin/redis-stats`
Returns Redis usage statistics:
```json
{
  "commands": 3100,
  "memoryMB": 15,
  "hitRate": 0.85,
  "keys": {
    "voice:*": 1200,
    "ratelimit:*": 800,
    "cache:*": 500
  }
}
```

---

## Components Structure

```
app/admin/dashboard/
└── page.tsx                 # Main dashboard

components/admin/
├── UsersManagementTab.tsx   # User management
├── RoomsManagementTab.tsx   # Room management
├── PerformanceTab.tsx       # Performance metrics
└── SystemLogsTab.tsx        # Log viewer

app/api/admin/
└── redis-stats/route.ts     # Redis stats API
```

---

## Security Features

1. **Authentication Required**
   - Verifies user is logged in
   - Checks `is_admin` flag

2. **Authorization Checks**
   - All API routes check admin status
   - Client-side redirects for non-admins

3. **Audit Trail**
   - All admin actions logged
   - Timestamps and user tracking

---

## Customization

### Adding New Stats
Edit `app/admin/dashboard/page.tsx`:
```typescript
const fetchStats = async () => {
  // Add new stat query
  const { count: newStat } = await supabase
    .from('your_table')
    .select('*', { count: 'exact', head: true })
  
  setStats({ ...stats, newStat })
}
```

### Adding New Tabs
1. Create component in `components/admin/`
2. Import in main dashboard
3. Add to tabs list

### Custom Metrics
Add to Performance Tab (`components/admin/PerformanceTab.tsx`)

---

## Troubleshooting

### "Unauthorized access" error
- Make sure your user has `is_admin = true`
- Clear browser cache and re-login

### Stats not loading
- Check Supabase connection
- Verify RLS policies allow admin reads
- Check browser console for errors

### Performance metrics showing 0
- Redis stats API might be failing
- Check `/api/admin/redis-stats` directly
- Verify Redis is configured

---

## Future Enhancements

Planned features:
- [ ] Export data to CSV
- [ ] Bulk user actions
- [ ] Advanced analytics charts
- [ ] Email notifications for critical events
- [ ] Custom report generation
- [ ] Activity timeline
- [ ] Webhook management

---

## Best Practices

1. **Regular Monitoring**
   - Check dashboard daily
   - Monitor performance metrics weekly
   - Review logs for errors

2. **User Management**
   - Only grant admin to trusted users
   - Regularly review banned users list
   - Keep admin count minimal

3. **Performance**
   - Set alerts at 70% usage thresholds
   - Plan upgrades before hitting limits
   - Monitor trends, not just current values

4. **Security**
   - Never share admin credentials
   - Use strong passwords
   - Enable 2FA (if available)

---

## Support

For issues or questions:
1. Check system logs first
2. Review Supabase logs
3. Check Vercel deployment logs
4. Contact technical support

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0  
**License:** Internal Use Only
