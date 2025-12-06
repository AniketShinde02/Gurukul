
---

## 32. 🗺️ The Code Atlas (File-by-File Breakdown)

This section serves as a map for new developers joining the team.

### 📂 /components/ui (The Atomic Design System)
These properties are built on **Radix UI** primitives and styled with **Tailwind**.

*   **`accordion.tsx`**: Expandable content panels. Used in: Sidebar "Shared Files", FAQ sections.
    *   *Key Props*: `type="single" | "multiple"`.
*   **`avatar.tsx`**: Circular user image with fallback logic.
    *   *Fallbacks*: Image URL -> Initials -> Generic User Icon.
*   **`badge.tsx`**: Small status indicators (e.g., "Online", "Admin").
    *   *Variants*: `default` (Solid), `secondary` (Faded), `outline` (Border only).
*   **`button.tsx`**: The workhorse.
    *   *Variants*: `default` (Orange), `ghost` (Transparent), `link` (Underlined text).
    *   *Sizes*: `sm`, `default`, `lg`, `icon` (square).
*   **`card.tsx`**: The fundamental building block of the Dashboard.
    *   *Parts*: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
*   **`context-menu.tsx`**: Right-click menus.
    *   *Usage*: Right-click on a Sidebar Channel to "Delete" or "Mute".
*   **`dialog.tsx`**: Modal overlays.
    *   *Usage*: "Create Server" modal, "Settings" modal.
*   **`dropdown-menu.tsx`**: Click-triggered menus.
    *   *Usage*: User profile menu (Logout, Settings).
*   **`input.tsx`**: Styled HTML `<input>`.
    *   *Features*: Focus rings, disabled states, file input support.
*   **`label.tsx`**: Accessible labels for form inputs.
*   **`linkify.tsx`**: (Custom Utility) Detects URLs in text strings and wraps them in `<a>` tags.
    *   *Regex*: `/(https?:\/\/[^\s]+)/g`.
*   **`progress.tsx`**: Loading bars.
    *   *Usage*: Use for "XP Level Progress" or "Upload Progress".
*   **`radio-group.tsx`**: Select one from many.
    *   *Usage*: "Study Mode" selection (Audio vs Video).
*   **`scroll-area.tsx`**: Custom scrollbar implementation.
    *   *Why*: Browser scrollbars are ugly. This ensures identical scrolling across Win/Mac.
*   **`sheet.tsx`**: Slide-out panels (Drawers).
    *   *Usage*: Mobile Navigation Sidebar.
*   **`switch.tsx`**: Toggle switches.
    *   *Usage*: "Mic On/Off" in settings.
*   **`tabs.tsx`**: Tabbed content switching.
    *   *Usage*: "Chat" vs "Participants" in the Study Room sidebar.
*   **`textarea.tsx`**: Multi-line text input.
*   **`tooltip.tsx`**: Hover helper text.
    *   *Usage*: Icon-only buttons (explain what they do).

### 📂 /app (The Routes)

*   **`layout.tsx`**: Global Root. Defines `<html>` and `<body>`. Loads Fonts.
*   **`globals.css`**: Tailwind directives + CSS Variables (`--bg-root`, `--primary-orange`).
*   **`page.tsx`**: The Landing Page (Public).
    *   *Content*: Hero section, Features grid, Testimonials.
*   **`/auth`**:
    *   **`/signin/page.tsx`**: Login Form.
    *   **`/callback/route.ts`**: Supabase Auth Callback (Exchange Code for Session).
*   **`/(authenticated)`**: Route Group (Protected).
    *   **`/dashboard/page.tsx`**: Main Hub. Stats, Recent Activity.
    *   **`/profile/page.tsx`**: User settings, Avatar upload.
    *   **`/sangha/page.tsx`**: Server Discovery / Community Home.
    *   **`/study/room/[roomId]/page.tsx`**: The Video Call interface.

### 📂 /lib (Utilities)

*   **`supabase/client.ts`**: Exports the typed Supabase Client instance.
*   **`utils.ts`**: `cn()` helper (Classname merger using `clsx` and `tailwind-merge`).

### 📂 /hooks (Custom Logic)

*   **`useWebRTC.ts`**: The brain of the video call. Manages `RTCPeerConnection`, Signaling, and Tracks.
*   **`useDm.ts`**: Manages Direct Message fetching and real-time subscriptions.
*   **`useToast.ts`**: (Legacy) Toast management (Replaced mostly by `react-hot-toast`).

---

## 33. 🐛 Common Errors & Known Fixes (The Knowledge Base)

### Error: "Hydration Mismatch"
*   **Cause**: Text rendered on Server (e.g., a timestamp) differs from Client (timezone diff).
*   **Fix**: Use `suppressHydrationWarning` on the specific element, or render timestamps only inside `useEffect`.

### Error: "RLS Policy Violation"
*   **Cause**: You tried to select data you don't own.
*   **Fix**: Check `supabase/policies` in the SQL Editor. Ensure `auth.uid()` matches the owner column.

### Error: "MediaDeviceNotSupported"
*   **Cause**: User denied camera permissions or has no camera.
*   **Fix**: Wrap `getUserMedia` in a `try/catch` and show a "Camera Blocked" UI state.

---

*Atlas Updated: 2025-12-06*
