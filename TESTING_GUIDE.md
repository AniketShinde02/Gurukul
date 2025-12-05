# Testing Guide: New Features

Now that the database schemas are applied, follow these steps to verify the new functionality in the app.

## 1. Pomodoro Timer
**Goal:** Verify the timer works and syncs between users.
1.  **Navigate to a Room:** Go to any study room (e.g., `/sangha/rooms/[id]`).
2.  **Locate Timer:** Look for the "Pomodoro Timer" in the **Left Sidebar** (under "Productivity Tools").
3.  **Test Controls (Admin/Host):**
    *   Click **Start**. The timer should begin counting down.
    *   Click **Stop**. The timer should pause/stop.
    *   Click **Reset**. The timer should return to 25:00.
    *   Change Mode: Click the icons for "Short Break" (Coffee) or "Long Break". The duration should change.
4.  **Verify Sync:** Open the same room in a **Incognito Window** (or another browser). You should see the timer running in sync with the main window.

## 2. Whiteboard Persistence
**Goal:** Ensure drawings are saved and loaded correctly.
1.  **Select Channel:** Click on the **"Canvas"** channel in the sidebar.
2.  **Draw:** Use the tools to draw a shape or write text.
3.  **Refresh:** Refresh the page (`F5`).
4.  **Verify:** Navigate back to the "Canvas" channel. **Your drawing should still be there.**
5.  **Real-time:** If you have the Incognito window open, check if the drawing appears there automatically.

## 3. XP & Leveling System
**Goal:** Verify XP is awarded for activity.
1.  **Check Initial XP:** Click your **Avatar** (bottom left) to open the Profile Popup. Note your current XP and Level.
2.  **Earn XP (Chat):**
    *   Go to the **"General"** (Text) channel.
    *   Send a message (e.g., "Testing XP").
    *   **Check Profile:** Open the popup again. Your XP should have increased by **5 points**.
3.  **Earn XP (Voice):**
    *   Join a **Voice Channel**.
    *   Wait for 1 minute.
    *   **Check Profile:** Your XP should increase by **10 points**.
4.  **Leaderboard:**
    *   Look at the **Right Sidebar** (Room Info).
    *   Check the **"Top Students"** section. You should see yourself listed with your current Level and XP.

## 4. Lo-Fi Music Player
**Goal:** Verify music playback.
1.  **Locate Player:** Look for the Music Player in the **Left Sidebar** (below the Timer).
2.  **Play:** Click the **Play** button. Music should start.
3.  **Change Station:** Click the "Next" button to switch stations (e.g., Lofi Girl -> Synthwave).
4.  **Volume:** Adjust the volume slider.

## Troubleshooting
- **"Relation does not exist"**: If you see this error in the console, it means a database table is missing. Run the migration scripts again.
- **Timer not syncing**: Ensure you are connected to the internet and Supabase Realtime is active (green "Connected" status in network tab usually).
