# 🎨 DISCORD-STYLE ROLE BADGE SYSTEM - IMPLEMENTATION PLAN

**Date**: December 12, 2025  
**Feature**: Role Assignment & Badge Display (Discord-style)  
**Status**: 📋 PLANNING

---

## 🔍 **RESEARCH: HOW DISCORD WORKS**

### **Discord's Role System**:

1. **Role Hierarchy**:
   - Roles have a `position` (0 = highest priority)
   - Higher roles override lower roles
   - User's color = highest role's color
   - User's badge = highest role's icon

2. **Role Display in Member List**:
   ```
   👤 Username                    [Role Badge/Icon]
      @username                   Admin • Mod • Member
   ```

3. **Role Badges/Icons**:
   - **Server Owner**: 👑 Crown icon (gold)
   - **Admin**: 🛡️ Shield icon (red)
   - **Moderator**: 🔨 Hammer icon (blue)
   - **Bot**: BOT badge (purple)
   - **Custom Roles**: Custom emoji/icon + color

4. **Role Assignment**:
   - User can have MULTIPLE roles
   - Highest role determines display color
   - All role badges show (but icon of highest role)
   - Server settings shows role hierarchy

---

## 🐛 **CURRENT ISSUES**

### **Issue 1: Admin View Not Fixed**
**Problem**: Gear icon opens settings but admin view breaks for admins

**Root Cause**: Need to investigate the settings modal

---

### **Issue 2: No Role Badges in Member List**
**Problem**: Roles exist but don't show badges/icons next to members

**Current State** (Line 223 in RoomInfoSidebar.tsx):
```tsx
{member.role && <span className="text-[10px] text-stone-500 font-medium">{member.role}</span>}
```

**Issues**:
- Only shows text (no icon)
- Only shows ONE role (users can have multiple)
- No color coding
- No hierarchy

---

### **Issue 3: Role Assignment Not Like Discord**
**Problem**: Role system exists but doesn't work like Discord

**Current State**:
- ✅ Database has `room_roles` table
- ✅ `room_participants` has `role_id` column
- ❌ No support for MULTIPLE roles per user
- ❌ No role icons
- ❌ No role badges display
- ❌ No owner badge

---

## 🎯 **SOLUTION: DISCORD-STYLE IMPLEMENTATION**

### **Step 1: Database Schema Update**

#### **1.1 Add Role Icons Column**
```sql
ALTER TABLE room_roles 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- icon can be:
-- - Emoji (e.g., "🛡️", "👑", "🔨")
-- - Icon name (e.g., "shield", "crown", "hammer")
-- - URL to custom icon image
```

#### **1.2 Create User-Roles Junction Table (Multiple Roles)**
```sql
CREATE TABLE IF NOT EXISTS room_user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES room_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(room_id, user_id, role_id)
);

-- Enable RLS
ALTER TABLE room_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles are viewable by members"
ON room_user_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = room_user_roles.room_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage user roles"
ON room_user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM room_participants rp
    JOIN room_roles r ON rp.role_id = r.id
    WHERE rp.room_id = room_user_roles.room_id 
    AND rp.user_id = auth.uid()
    AND (r.permissions->>'manage_roles')::boolean = true
  )
);
```

#### **1.3 Add Owner Badge Support**
```sql
-- Already exists in study_rooms:
-- owner_id UUID REFERENCES profiles(id)

-- We'll use this to show crown icon for owner
```

---

### **Step 2: Update Member Fetching Logic**

#### **2.1 Fetch Members with ALL Roles**
**File**: `components/sangha/RoomInfoSidebar.tsx`

**Current Query** (Line 35-50):
```typescript
const { data, error } = await supabase
    .from('room_participants')
    .select(`
        user_id,
        role,
        profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            is_online,
            xp,
            level
        )
    `)
    .eq('room_id', roomId)
```

**New Query** (with multiple roles):
```typescript
const { data, error } = await supabase
    .from('room_participants')
    .select(`
        user_id,  
        role_id,
        profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            is_online,
            xp,
            level
        ),
        room_user_roles!inner (
            role_id,
            room_roles (
                id,
                name,
                color,
                icon,
                position
            )
        )
    `)
    .eq('room_id', roomId)
```

**Process Roles**:
```typescript
const formatted = data.map((p: any) => {
    // Get all roles for this user
    const userRoles = p.room_user_roles?.map((ur: any) => ur.room_roles) || []
    
    // Sort by position (0 = highest)
    userRoles.sort((a: any, b: any) => a.position - b.position)
    
    // Highest role (for color and badge)
    const highestRole = userRoles[0]
    
    return {
        id: p.profiles.id,
        name: p.profiles.full_name || p.profiles.username,
        username: p.profiles.username,
        avatar_url: p.profiles.avatar_url,
        is_online: p.profiles.is_online,
        xp: p.profiles.xp || 0,
        level: p.profiles.level || 1,
        roles: userRoles, // All roles
        highestRole: highestRole, // For display
        roleColor: highestRole?.color || '#99aab5',
        roleIcon: highestRole?.icon || null
    }
})
```

---

### **Step 3: Add Role Badge Component**

#### **3.1 Create RoleBadge Component**
**File**: `components/sangha/RoleBadge.tsx` (NEW)

```typescript
import { Shield, Crown, Hammer, Bot } from 'lucide-react'

type RoleBadgeProps = {
    role: {
        name: string
        color: string
        icon?: string | null
    }
    isOwner?: boolean
    size?: 'sm' | 'md' | 'lg'
}

const ICON_MAP: Record<string, any> = {
    'shield': Shield,
    'crown': Crown,
    'hammer': Hammer,
    'bot': Bot
}

export function RoleBadge({ role, isOwner = false, size = 'sm' }: RoleBadgeProps) {
    // Size mappings
    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }
    
    const iconSize = sizes[size]
    
    // Owner always gets crown
    if (isOwner) {
        return (
            <div className="flex items-center gap-1">
                <Crown className={`${iconSize} text-yellow-500`} title="Server Owner" />
            </div>
        )
    }
    
    // If role has icon
    if (role.icon) {
        // Check if it's an icon name
        const IconComponent = ICON_MAP[role.icon.toLowerCase()]
        
        if (IconComponent) {
            return (
                <IconComponent 
                    className={iconSize} 
                    style={{ color: role.color }}
                    title={role.name}
                />
            )
        }
        
        // Check if it's emoji
        if (/\p{Emoji}/u.test(role.icon)) {
            return <span title={role.name}>{role.icon}</span>
        }
        
        // Check if it's URL
        if (role.icon.startsWith('http')) {
            return <img src={role.icon} alt={role.name} className={iconSize} />
        }
    }
    
    // Fallback: just show colored dot
    return (
        <div 
            className={`${iconSize} rounded-full`} 
            style={{ backgroundColor: role.color }}
            title={role.name}
        />
    )
}
```

---

### **Step 4: Update Member List Display**

#### **4.1 Update RoomInfoSidebar.tsx**
**File**: `components/sangha/RoomInfoSidebar.tsx` (Lines 206-227)

**Before**:
```tsx
<div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
    <div className="relative">
        <Avatar className="w-10 h-10 border border-white/10">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-stone-800 text-stone-300">
                {member.username[0].toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-stone-900 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-stone-600'}`} />
    </div>
    <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
            <span className="font-bold text-stone-200 text-sm truncate">
                {member.name}
                {currentUser && member.id === currentUser.id && <span className="text-stone-500 ml-1">(You)</span>}
            </span>
            {member.role && <span className="text-[10px] text-stone-500 font-medium">{member.role}</span>}
        </div>
        <div className="text-xs text-stone-500 truncate">@{member.username}</div>
    </div>
</div>
```

**After** (Discord-style):
```tsx
<div className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
    <div className="relative">
        <Avatar className="w-10 h-10 border border-white/10" style={{ borderColor: member.roleColor }}>
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="bg-stone-800 text-stone-300">
                {member.username[0].toUpperCase()}
            </AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-stone-900 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-stone-600'}`} />
        
        {/* Owner Crown Badge on Avatar */}
        {member.isOwner && (
            <div className="absolute -top-1 -right-1 bg-stone-900 rounded-full p-0.5">
                <Crown className="w-3 h-3 text-yellow-500" />
            </div>
        )}
    </div>
    <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0 flex-1">
                <span 
                    className="font-bold text-sm truncate"
                    style={{ color: member.roleColor }}
                >
                    {member.name}
                    {currentUser && member.id === currentUser.id && <span className="text-stone-500 ml-1">(You)</span>}
                </span>
                {/* Role Badge (Highest Role Icon) */}
                {member.highestRole && (
                    <RoleBadge role={member.highestRole} isOwner={member.isOwner} size="sm" />
                )}
            </div>
            
            {/* All Role Tags (on hover or always) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {member.roles?.slice(0, 3).map((role: any) => (
                    <span 
                        key={role.id}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ 
                            backgroundColor: `${role.color}20`,
                            color: role.color
                        }}
                    >
                        {role.name}
                    </span>
                ))}
                {member.roles?.length > 3 && (
                    <span className="text-[10px] text-stone-500">+{member.roles.length - 3}</span>
                )}
            </div>
        </div>
        <div className="text-xs text-stone-500 truncate">@{member.username}</div>
    </div>
</div>
```

---

### **Step 5: Update ServerSettingsModal**

#### **5.1 Add Role Icon Picker**
**File**: `components/sangha/ServerSettingsModal.tsx`

**Add to Role Editor** (Around line 540):
```tsx
{/* Role Icon Picker */}
<div>
    <label className="text-sm font-medium text-stone-300 mb-2 block">Role Icon</label>
    <div className="grid grid-cols-6 gap-2">
        {[
            { icon: 'shield', label: 'Shield', Component: Shield },
            { icon: 'crown', label: 'Crown', Component: Crown },
            { icon: 'hammer', label: 'Hammer', Component: Hammer },
            { icon: 'bot', label: 'Bot', Component: Bot },
            { icon: '🛡️', label: 'Shield Emoji', Component: null },
            { icon: '👑', label: 'Crown Emoji', Component: null },
            { icon: '🔨', label: 'Hammer Emoji', Component: null },
            { icon: '🤖', label: 'Bot Emoji', Component: null },
        ].map((item) => (
            <button
                key={item.icon}
                onClick={() => setEditedRole({ ...editedRole!, icon: item.icon })}
                className={`p-2 rounded-lg border transition-colors ${
                    editedRole?.icon === item.icon
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-stone-700 hover:border-stone-600'
                }`}
                title={item.label}
            >
                {item.Component ? (
                    <item.Component className="w-5 h-5 text-stone-300" />
                ) : (
                    <span className="text-xl">{item.icon}</span>
                )}
            </button>
        ))}
        <button
            onClick={() => setEditedRole({ ...editedRole!, icon: null })}
            className="p-2 rounded-lg border border-stone-700 hover:border-stone-600 transition-colors text-stone-500 text-xs"
        >
            None
        </button>
    </div>
</div>
```

---

### **Step 6: Fix Admin View Issue**

**Need to investigate**: Where is the gear icon and what breaks for admins?

**Steps**:
1. Check where gear icon is rendered
2. Check what "admin view" means
3. Identify the issue
4. Fix it

---

## 📁 **FILES TO MODIFY**

### **Database**:
1. ✅ Add migration script: `scripts/add-role-badges.sql`

### **Components**:
1. ✅ NEW: `components/sangha/RoleBadge.tsx`
2. ✅ UPDATE: `components/sangha/RoomInfoSidebar.tsx`
3. ✅ UPDATE: `components/sangha/ServerSettingsModal.tsx`
4. ⏳ INVESTIGATE: Gear icon component (admin view issue)

### **Hooks** (if needed):
1. ⏳ NEW: `hooks/useRoles.ts` (for fetching roles)

---

## 🧪 **TESTING CHECKLIST**

- [ ] Single role assigned → Badge shows
- [ ] Multiple roles assigned → All badges show on hover
- [ ] Highest role color applies to username
- [ ] Owner gets crown badge
- [ ] Admin can assign/remove roles
- [ ] Role hierarchy respected
- [ ] Role icons display correctly (emoji, icon name, URL)
- [ ] Gear icon works for admins
- [ ] Settings modal doesn't break

---

## 🎯 **EXPECTED RESULT**

**Member List** (Discord-style):
```
Members — 3

👤 Aniket Shinde  👑              Owner
   @ai.captioncraft               Admin • Mod

👤 Don (You)       🛡️              Member
   @CalmShark19                   Member

👤 CalmShark19                    Member
   @calms                         Member
```

**Features**:
- ✅ Owner has crown badge
- ✅ Admin has shield badge
- ✅ Username colored by highest role
- ✅ Role tags show on hover
- ✅ Clean, Discord-like UI

---

**Status**: 📋 READY TO IMPLEMENT  
**Estimated Time**: 3-4 hours  
**Priority**: 🔴 HIGH
