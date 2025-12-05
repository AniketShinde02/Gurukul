# 🎓 Chitchat (Gurukul) - The Future of Digital Learning Communities

![Project Banner](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop)

**Chitchat (Gurukul)** is a next-generation platform for student communities, blending the best of real-time communication (like Discord) with focused study tools and gamification. Built for students, by students, it creates a "Digital Gurukul" where learning is social, engaging, and verified.

## 🚀 Features

### 🌟 Core Experience
*   **Real-time Messaging**: Robust chat with rich text, markdown support, and file sharing.
*   **Voice & Video Lounges**: High-quality audio/video calls powered by LiveKit, with easy screen sharing.
*   **"Sangha" (Servers)**: Organized communities with custom text, voice, and video channels.
*   **Study Rooms**: Dedicated visuals and tools for focused study sessions.

### 🛡️ Student Logic & Safety
*   **College Verification**: Secure `.edu` email auto-verification and manual student ID scanning (OCR).
*   **Role-Based Access**: Granular permissions (Admin, Moderator, Student, Guest) for secure community management.
*   **Private & Secure**: Row Level Security (RLS) ensures your data is yours alone.

### 🎮 Gamification & Productivity
*   **XP & Leveling System**: Earn XP for every minute you study. Level up and show off your scholar rank!
*   **Global Leaderboards**: Compete with other students for the top spot on the podium.
*   **Focus Tools**: Integrated Pomodoro Timer, Lo-Fi Music Player, and shared Whiteboards.

### 🎨 Design & Tech
*   **"Vedic" Dark Mode**: A beautiful, eye-strain-friendly immersive dark theme with glassmorphism effects.
*   **Mobile Optimized**: Responsive layout with native-like navigation drawers for learning on the go.
*   **Modern Stack**: Built with the latest tech for speed and scalability.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage)
*   **Real-time Media**: [LiveKit](https://livekit.io/) (WebRTC Video/Audio)
*   **State Management**: React Hooks + Optimistic UI updates
*   **Deployment**: Vercel (Recommended)

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js 18+ installed
*   A [Supabase](https://supabase.com/) account
*   A [LiveKit](https://livekit.io/) account

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/chitchat.git
cd chitchat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add keys from your Supabase and LiveKit dashboards:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
```

### 4. Database Setup
Run the SQL scripts located in the `scripts/` folder in your Supabase SQL Editor to set up tables (Profiles, Rooms, Messages, XP, Verification).

### 5. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app in action!

---

## 📱 Screenshots

| Dashboard | Study Room |
|:---:|:---:|
| *Admin Dashboard & Quick Actions* | *Focus Mode with Timer* |

| Mobile View | Leaderboard |
|:---:|:---:|
| *Responsive Navigation* | *Gamified Rankings* |

---

## 🤝 Contributing

We welcome contributions! Please fork the repository and submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for learners everywhere.*
