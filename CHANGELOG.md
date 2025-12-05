# Changelog

## [Unreleased]

### Added
- **User Profile Popup**: Implemented Discord-style mini profile card with real backend integration
  - Editable display name and bio with inline editing
  - Avatar upload with Supabase Storage integration
  - Real-time data fetching from `profiles` table
  - Session-safe updates (prevents changes during active calls)
  - Quick actions: Copy User ID, Full Settings redirect, Logout
  - Voice controls (Mute/Unmute, Camera On/Off) when in active call
  - Optimized positioning above user avatar with viewport boundary detection
  - `userProfileUpdated` event for cross-component synchronization
- **Settings Page Integration**: "Full Settings" button now redirects to `/settings` page instead of opening modal
- **Embedded Video Call**: Implemented portal-based video rendering to keep the call within the room layout ("jitna chat ki window hai").
- **Punchy Loading UI**: Updated the call connection screen with "Entering the Digital Gurukul..." animation and gold gradients.
- **Global Call Manager**: Enhanced to support both Full Screen (overlay) and Embedded (in-room) modes dynamically.
- **Room Channels**: Implemented dynamic Text, Voice, and Canvas channels for Study Rooms.
- **Server Settings**: Added ability to Rename Server and Create/Delete Channels via a new dropdown menu.
- **Excalidraw Whiteboard**: Fixed Excalidraw rendering by importing CSS.
- **Chat**: Added auto-linking for URLs in messages (DM & Room).
- **Sidebar**: Added "(You)" indicator in member list and implemented file list display.
- **Room Chat Features**: Added LHS/RHS message layout, Copy/Reply/Delete actions, and rich file uploads to Room Chat (matching DM features).
- **Real Data Integration**: Replaced hardcoded "ME" user and static file counts in Room Sidebar with real data from Supabase.
- **Error Suppression**: Silenced harmless "room does not exist" errors from LiveKit participant polling.

### Fixed
- **Database Table Reference**: Corrected all user queries from `users` table to `profiles` table (fixed 404 errors)
- **Z-Index Hierarchy**: Established proper layering to prevent UI overlap issues
  - Profile Popup: `z-9999` (highest priority)
  - Chat Input: `z-20`
  - Emoji/GIF Pickers: `z-50`
  - Settings Modal: `z-70` (removed from room sidebar)
- **Reply Crash**: Fixed a crash when viewing a reply to a message from a deleted user.
- **Settings Cropping**: Fixed an issue where settings popovers were cropped by the sidebar by using `DropdownMenu` (Portal).
- **Schema Updates**: Added missing columns (`type`, `file_url`, `parent_id`) to `room_messages` and created `room_channels` table.

### Removed
- **UserSettingsModal from Room Sidebar**: Removed redundant in-room settings modal in favor of dedicated `/settings` page

## [2025-12-05] - Visual Polish & Admin Tools
 
### Fixed
- **Server Settings Images**: Fixed a critical issue where server icon and banner uploads were not saving correctly. Added proper error handling and immediate UI refresh.
- **Sidebar Styling**: Updated the `RoomSidebar` theme to match the main application's consistent dark mode (removed transparent blur in favor of solid background).
- **Layout Logic**: Fixed syntax errors in `SanghaLayout.tsx` related to closing tags and structure.

### Added
- **Dashboard Navigation**: Added a dedicated "Main Dashboard" button with a unique Sky Blue hover effect to the top of the server rail.
- **Channel Management**: Added "Delete Channel" option to the channel context menu, available exclusively to server admins.
- **Role-Based UI**: Enhanced the user controls section to match the new dark theme.

## [2025-12-05] - Context Menu & UX Polish

### Fixed
- **Context Menu Persistence**: Resolved a critical issue where the browser's default context menu would override the custom app menu on Server and Channel icons.
  - **Root Cause**: Conflict between Next.js `Link` components (anchor tags) and custom event handlers, plus duplicate rendering logic in `SanghaLayout`.
  - **Fix**: Refactored `ServerSidebar` and `SanghaLayout` to use programmatic navigation (`useRouter`) instead of `Link` tags. Implemented a robust manual context menu system that strictly enforces `e.preventDefault()` and `e.stopPropagation()`.
- **Server Rail Navigation**: Unified the rendering logic for the server rail in `SanghaLayout.tsx` to ensure consistent behavior and event handling across the app.
- **Tooltip Interference**: Fixed issues where tooltips were blocking right-click events by restructuring the component hierarchy.

### Added
- **Copy ID Actions**: Added functional "Copy Server ID" and "Copy Channel ID" options to the new context menus.
- **Leave Server Action**: "Leave Server" button in the context menu is now fully functional with confirmation dialogs.

## [2025-12-04] - Roles, Permissions & Security Hardening

### Added
- **Whiteboard Persistence**: Collaborative drawings are now saved to the database and persist across sessions.
- **Pomodoro Timer**: Shared timer for study rooms with real-time synchronization and role-based controls.
- **Lo-Fi Music Player**: Integrated music player with curated stations for study focus.
- **XP & Leveling System**: Users earn XP for chatting and voice activity, with levels displayed in their profile.
- **Role-Based Security**: Enhanced RLS policies for Channels, Timers, and Whiteboards to ensure secure access.
- **Advanced Roles System**:
  - Implemented `room_roles` table supporting custom roles (Admin, Moderator, Member).
  - Added `room_bans` table for server-side ban management.
  - Migrated existing `room_participants` to use the new `role_id` foreign key.
- **Granular Permissions**:
  - Added JSON-based permissions column (`manage_channels`, `kick_members`, `ban_members`, etc.) to roles.
  - Updated `useServerPermissions` hook to auto-grant Admin privileges to Room Owners.
- **Robust Security (RLS)**:
  - Implemented Row Level Security policies for `room_channels` and `room_roles`.
  - Fixed "Infinite Recursion" bug in RLS policies by splitting SELECT and INSERT/UPDATE/DELETE checks.
  - Explicitly allowed Room Owners and Admins to manage channels and roles via secure SQL policies.
- **UI Accessibility**:
  - Fixed `DialogContent` accessibility errors by adding visually hidden `DialogTitle` components to `ServerSettingsModal` and `ChannelSettingsModal`.

### Fixed
- **Database Migration**:
  - Split migration scripts into DDL (Part 1) and DML (Part 2) to prevent "column does not exist" errors during schema upgrades.
  - Fixed `run_migration.js` to execute scripts sequentially and handle errors gracefully.
- **Channel Creation**:
  - Resolved "Failed to create channel" errors by fixing RLS policies that were blocking legitimate Admin actions.
  - Added detailed error reporting in the UI (Toast notifications now show specific database errors).
- **Null Safety**:
  - Fixed "possibly null" TypeScript errors in `ServerSettingsModal` using optional chaining (`roomDetails?.icon_url`).

## [2025-12-04] - Collaborative Whiteboard & Video Enhancements
...
