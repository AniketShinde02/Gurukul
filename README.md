# 🕉️ Chitchat (Gurukul)
> *The Digital Ashram for the Modern Scholar.*

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📜 The Story
In an age of disconnected learning and sterile LMS platforms, **Chitchat (Gurukul)** was born from a simple desire: to bring the *soul* back to studying. 

We missed the feeling of a late-night library session. We missed the serendipity of meeting a study partner who changes your academic trajectory. We missed the "Sangha" (Community).

So we built it. 

**Chitchat** is not just a video calling app. It is a **persistent, gamified, spiritual study universe**. It combines the best of **Discord** (communities), **Omegle** (discovery), and **Forest** (focus) into a single, cohesive "Digital Gurukul".

---

## ✨ Features at a Glance

### 🏛️ The Sangha (Community)
Create or join topic-specific **Sanghas** (Servers). Whether you're studying *Quantum Physics* or *Sanskrit Literature*, there's a home for you.
- **Rich Text Channels**: Markdown support, code blocks, and file sharing.
- **Voice Lounges**: Drop-in audio spaces for casual chatter.
- **Cinema Rooms**: Watch lectures together with synchronized playback.

### 📹 The Study Lounge (Video)
Powered by **LiveKit** and **WebRTC**, our video calls are crystal clear and lag-free.
- **Focus Mode**: Minimalist UI for deep work.
- **Whiteboard**: Collaborative **Excalidraw** integration for solving problems together in real-time.
- **Screen Share**: 1080p screen sharing for peer tutoring.

### 🧘 Gamified Focus
Studying shouldn't feel like a chore.
- **XP System**: Earn XP for every minute you study.
- **Leaderboards**: Compete with friends and the global community.
- **Pomodoro Timer**: Built-in flow-state management.
- **Lo-Fi Player**: Curated beats to keep you in the zone.

### 🎨 The "Vedic" Aesthetic
A UI Design Language we call **"Stone & Saffron"**.
- **Dark Mode First**: Deep `stone-950` backgrounds tailored for late-night sessions.
- **Glassmorphism**: Subtle blurs (`backdrop-blur-md`) that feel modern yet grounded.
- **Motion**: Powered by `framer-motion` for fluid, organic transitions.

---

## 🛠️ Technology Stack

We believe in using the absolute best tools for the job.

| Layer | Technology | Why? |
|-------|------------|------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js-14-black) | The React Framework for the Web. App Router for nested layouts. |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) | Strict typing for a bulletproof codebase. |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) | Utility-first CSS for rapid UI development. |
| **Components** | ![Radix UI](https://img.shields.io/badge/Radix_UI-Primitives-white) | Accessible, unstyled primitives for custom design systems. |
| **Database** | ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) | Scalable, relational data with Row Level Security. |
| **Realtime** | ![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-purple) | World-class video and audio infrastructure. |
| **Whiteboard** | ![Excalidraw](https://img.shields.io/badge/Excalidraw-Canvas-yellow) | The best hand-drawn whiteboard tool on the web. |

---

## 📸 Functionality Showcase

### The Dashboard
*Your central hub for productivity.*
> **[Screenshot Needed: Dashboard View]**
> *Showcasing: User stats card, "Quick Join" buttons, Friend activity feed.*

### The Study Room
*Where the magic happens.*
> **[Screenshot Needed: Active Call]**
> *Showcasing: Grid video view, whiteboard open on the side, chat drawer expanded.*

### The Sangha
*Your community home.*
> **[Screenshot Needed: Server Channel List]**
> *Showcasing: Channel categories, active voice users, server banner.*

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Use `npm` (Project standard)

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-username/chitchat.git
   cd chitchat
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_secret_role_key

   # LiveKit
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Visit the App**
   Open `http://localhost:3000`

---

## 🤝 Contribution Guidelines

We follow a strict **"Quality First"** policy.
1. **Fork** the repo.
2. **Branch** off `main` (`git checkout -b feature/amazing-idea`).
3. **Commit** with clear messages.
4. **Push** and open a PR.

> **Note**: Please ensure no TypeScript errors exist before pushing. Run `npx tsc --noEmit` to verify.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <small>Built with 🧡 by the Chitchat Team</small>
</p>
