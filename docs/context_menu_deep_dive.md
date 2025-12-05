# Context Menu Implementation Deep Dive

## Overview
This document details the technical challenges and final solution for implementing Discord-style custom context menus in the Chitchat application. The primary goal was to replace the browser's default right-click menu with a custom, feature-rich menu for Servers and Channels, ensuring a seamless "native app" feel.

## The Problem
Users reported that right-clicking on Server Icons or Channel Items frequently triggered the browser's default context menu (showing options like "Open link in new tab", "Save image as", etc.) instead of the application's custom context menu.

### Root Causes Identified
1.  **Event Propagation & Default Behavior**: The browser's `contextmenu` event was not being consistently intercepted or prevented (`e.preventDefault()`).
2.  **Component Nesting**: The initial implementation used Radix UI's `ContextMenu` component. While powerful, its event listeners were sometimes conflicting with other interactive elements (like `TooltipTrigger` or `Link` components) wrapped around the same target.
3.  **`Link` Component Interference**: The Server Icons were wrapped in Next.js `Link` components (`<a>` tags). Browsers treat anchor tags specially, often prioritizing their native context menu (for "Open in new tab") over custom Javascript handlers, especially if the click event bubbled up to the anchor before being caught.
4.  **Layout-Level Rendering**: A critical discovery was that the Server List was being rendered in two places: `ServerSidebar.tsx` (the intended component) and `SanghaLayout.tsx` (a layout file that was manually rendering the list for navigation). The `SanghaLayout.tsx` implementation was using raw `Link` components without any context menu logic, effectively bypassing the fixes applied to `ServerSidebar.tsx`.

## The Solution

### 1. Manual Context Menu Implementation
We moved away from the Radix UI `ContextMenu` primitive for these specific items in favor of a manual, lightweight implementation using React state. This gave us absolute control over event handling.

**Key Logic:**
```typescript
const [contextMenu, setContextMenu] = useState<{ x: number, y: number, data: any } | null>(null)

const handleContextMenu = (e: React.MouseEvent, data: any) => {
    e.preventDefault() // CRITICAL: Stops browser menu
    e.stopPropagation() // CRITICAL: Stops event bubbling
    setContextMenu({ x: e.clientX, y: e.clientY, data })
}
```

### 2. Eliminating `Link` Components
We replaced all `Link` components for Server and Channel items with standard `div` or `button` elements. Navigation is now handled programmatically:

```typescript
const router = useRouter()
// ...
<div onClick={() => router.push(`/sangha/rooms/${id}`)} ... />
```
This removes the semantic `<a>` tag, preventing the browser from treating the element as a link and overriding our context menu.

### 3. Global Click Listener
To mimic native behavior, we added a global listener to close the menu when the user clicks anywhere else on the screen:

```typescript
useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
}, [])
```

### 4. Layout Refactoring (`SanghaLayout.tsx`)
The final and most crucial fix involved refactoring `app/(authenticated)/sangha/layout.tsx`.
- **Removed**: Raw `Link` components for server items.
- **Added**: The manual `handleContextMenu` logic and state.
- **Added**: `useRouter` for navigation.
- **Result**: The layout now correctly renders the server rail with full custom context menu support, matching the behavior of `ServerSidebar.tsx`.

## Features Implemented
The new custom context menu supports:
- **Server Actions**:
    - Notification Settings
    - Mute Server
    - Privacy Settings
    - Edit Server Profile
    - **Leave Server** (Functional)
    - **Copy Server ID** (Functional)
- **Channel Actions**:
    - Mark As Read
    - Mute Channel
    - **Edit Channel** (Admin/Owner only)
    - **Delete Channel** (Admin/Owner only)
    - **Copy Channel ID** (Functional)

## Conclusion
By taking full control of the `contextmenu` event and removing semantic anchor tags in favor of programmatic navigation, we achieved a robust, native-like experience that reliably suppresses the browser's default behavior.
