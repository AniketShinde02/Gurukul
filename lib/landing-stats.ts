// Landing Page Static Stats
// Update these manually as your platform grows
// No API calls, no database queries, instant page load

export const LANDING_STATS = {
    // ===== USER COUNT =====
    // Update this when you hit milestones: 50, 100, 500, 1000, etc.
    userCount: 0,
    showUserCount: false, // Set to true when userCount >= 50

    // ===== LAUNCH PHASE =====
    // "beta" = Show "Beta Launch" badge
    // "growing" = Show user count + "Join the growing community"
    // "established" = Show user count + testimonials
    launchPhase: "beta" as "beta" | "growing" | "established",

    // ===== FEATURED ROOMS =====
    // These should be REAL rooms you create in your app
    // Even if they're empty, they're real and users can join them
    rooms: [
        {
            name: "UPSC Aspirants Hub",
            emoji: "📚",
            description: "Students studying for civil services exams"
        },
        {
            name: "JEE Prep Zone",
            emoji: "🎯",
            description: "Engineering entrance exam students"
        },
        {
            name: "NEET Study Hall",
            emoji: "🏥",
            description: "Medical entrance exam students"
        },
        {
            name: "CA Foundation",
            emoji: "💼",
            description: "Chartered Accountancy students"
        }
    ],

    // Which room to highlight on landing page (0-3)
    // Change this weekly to rotate featured rooms
    featuredRoomIndex: 0,

    // ===== AVATARS =====
    // Use illustrated avatars instead of real user photos
    // These are placeholder avatars that look intentional, not fake
    avatars: [
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver"
    ],
    showAvatars: false, // Set to true when you have 50+ users

    // ===== TESTIMONIALS =====
    // ONLY add real testimonials from real users
    // Leave empty until you have genuine feedback
    testimonials: [] as Array<{
        name: string
        role: string
        quote: string
        verified: boolean
    }>,

    // ===== COPY VARIANTS =====
    ctaCopy: {
        beta: "Connect with students studying the same subjects and working towards the same goals.",
        growing: "Join hundreds of students finding study buddies and learning together.",
        established: "Join thousands of students collaborating and studying together every day."
    }
}

// Helper function to get current stats
export function getLandingStats() {
    const featured = LANDING_STATS.rooms[LANDING_STATS.featuredRoomIndex]
    const ctaCopy = LANDING_STATS.ctaCopy[LANDING_STATS.launchPhase]

    return {
        ...LANDING_STATS,
        featuredRoom: featured,
        ctaCopy
    }
}

// Update guide:
// 1. When you hit 50 users: Set showUserCount = true, userCount = 50
// 2. When you hit 100 users: Set launchPhase = "growing", userCount = 100
// 3. When you get first testimonial: Add to testimonials array
// 4. Every week: Change featuredRoomIndex to rotate rooms (0, 1, 2, 3)
// 5. When you hit 1000 users: Set launchPhase = "established", userCount = 1000
