# 🚀 Social Media Launch Kit for Chitchat (Gurukul)

Here are drafted posts tailored for LinkedIn, Twitter/X, and technical blogs. I've highlighted the "5-day build" aspect and focused on the deep technical challenges we solved.

---

## 📢 Option 1: The "Viral" LinkedIn Post (Short & Punchy)
*Best for: Catching attention quickly. Focuses on the "5 Days" hook.*

**Headline**: I built a full-stack "Digital Ashram" for students in just 5 days. 🚀

Most student platforms feel sterile. I wanted to build something that felt like a late-night study session with friends—warm, productive, and alive.

Meet **Chitchat (Gurukul)**.

It’s not just a video app. It’s a persistent study universe built from scratch using **Next.js 14** and **Supabase**.

**⚡ Key Features I built:**
*   **Hybrid Real-time**: WebRTC video (LiveKit) + WebSocket chat (Supabase Realtime) working in sync.
*   **Collaborative Whiteboard**: A shared Excalidraw canvas that syncs across users.
*   **Deep Gamification**: XP systems, leaderboards, and Pomodoro timers to keep focus high.
*   **"Vedic" Dark UI**: A custom glassmorphism design system ("Stone & Saffron") that saves your eyes at 2 AM.

**👨‍💻 The Tech Stack:**
*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion.
*   **Backend**: Supabase (Postgres, Auth, Edge Functions).
*   **Video**: LiveKit WebRTC (SFU).

It was a crazy 5-day sprint of "Video Coding" from A to Z—writing proper custom hooks, handling strict TypeScript types, and squashing race conditions.

Check out the code & demo in the first comment! 👇

#NextJS #React #Supabase #WebRTC #BuildInPublic #SoftwareEngineering #Students

---

## 📝 Option 2: The "Deep Dive" Project Case Study (Long Form)
*Best for: Showing off Engineering Skills. Great for LinkedIn Articles or a detailed main post.*

**Title:** How I Built a Production-Ready Study Platform in 5 Days: The bugs, the fixes, and the architecture.

I challenged myself to build **Chitchat (Gurukul)**—a realtime study lounge—in under a week. I didn't want a "tutorial clone"; I wanted a platform with complex state, proper architecture, and strict type safety.

Here is the engineering journey behind the "Digital Ashram".

### The Challenge 🏗️
Building a video app is easy. Building a *stable* video app with synchronized chat, whiteboards, and persistence is hard. I faced three major technical hurdles during this sprint.

### 🐛 Bug 1: The "Missed Call" Race Condition
**The Issue:** When a user joined a room, the WebRTC "Offer" signal was sometimes sent before the receiver's database subscription was active. Result? Infinite "Connecting..." spinners.
**The Fix:** I discarded the standard "listen-only" approach. I wrote a custom hook (`useWebRTC`) that implements a "Catch-Up" mechanism. It connects, subscribes, *and immediately fetches chat history* to process any signals sent milliseconds before the connection opened.
**Lesson:** In distributed systems, never rely solely on real-time events. Always have a persisted "State of the World" to fall back on.

### 🛡️ Bug 2: RLS Policies vs. Friend Requests
**The Issue:** Supabase Row Level Security (RLS) is great, but it blocked users from checking if a friend request existed because they didn't "own" the row yet.
**The Fix:** I implemented the **Server-Side Trust Pattern**. I created a specialized API route (`/api/dm/start`) that bypasses client-side RLS using a service role key to securely verify friendship status on the backend, ensuring users can only chat if they are actually connected.

### 🎨 The "Optimize for Delete" UI
**The Issue:** Deleting a chat felt sluggish because we waited for the server to respond.
**The Fix:** I built an **Optimistic UI** pattern. The moment you click "delete," the UI updates instantly via React state. The server request happens in the background. If it fails, we rollback. If it succeeds, the user never notices the latency.

### The Stack 🛠️
*   **Framework**: Next.js 14 (App Router for that sweet RSC performance).
*   **State**: React Context + Hooks (No bloated global stores).
*   **Database**: PostgreSQL via Supabase.
*   **Style**: Vanilla CSS variables + Tailwind for a custom "Vedic Dark" theme.

This project pushed my understanding of **React Portals** (for the floating video player) and **Edge Architecture**.

Code valid? Yes.
Type safe? 100%.
Time taken? 5 Days.

#FullStack #Engineering #WebRTC #Supabase #Nextjs14 #CodingLife

---

## 🐦 Option 3: Twitter/X Thread (Fast Paced)
*Best for: Twitter/X. Thread these together.*

**Tw 1/5:**
Just wrapped up a 5-day coding sprint building Chitchat (Gurukul) 🕉️ using #NextJS14 and #Supabase.
It’s a realtime study lounge with video, chat, and collaborative whiteboards.
A thread on the tech challenges I faced 👇

**Tw 2/5:**
📹 **The Video Stack**
I used @LiveKit for WebRTC. P2P Mesh falls apart after 3 users, so relying on an SFU was key for scaling to 50+ students in a room.
Challenge: Race conditions during signaling.
Fix: Created a "Catch-Up" hook that syncs DB history with realtime events.

**Tw 3/5:**
🎨 **The Aesthetic**
No generic Bootstrap here. I built a custom "Vedic Dark" design system.
Deep `Stone-950` backgrounds (easier on eyes than pure black) + Glassmorphism.
Key takeaway: Good design isn't just colors; it's proper contrast and spacing.

**Tw 4/5:**
🛡️ **Security**
Enforced Row Level Security (RLS) on Postgres. Users can literally only fetch data they own.
Even if you hack the client, the DB says "Access Denied".
Security at the database layer > Security at the API layer.

**Tw 5/5:**
This was built from A-Z with strict TypeScript. No `any` types allowed. 🚫
Check out the repo here: [Link]
#BuildInPublic #IndieHackers #Coding

---

## ✅ Prerequisites Checklist (Before you post!)

Since you asked what I need, here is what you should have ready to make these posts successful:

1.  **The Demo Link**: You need a Vercel URL (e.g., `https://chitchat-gurukul.vercel.app`) so people can click and try it.
2.  **The GitHub Repo**: Make sure your repo is Public and the `README.md` (which I just updated!) is visible.
3.  **A Video/GIF**: Screenshots are good, but a screen recording of you joining a call and drawing on the whiteboard is *better*.
    *   *Tip*: Use a tool like Loom or OBS to record a 30s clip.
    *   *Showcase*: Login -> Dashboard -> Join Room -> Draw on Whiteboard.
