import { Step } from 'react-joyride'

export const tourSteps: Step[] = [
    {
        target: 'body',
        content: (
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">Welcome to Gurukul! 🎉</h3>
                <p className="text-stone-300">
                    Let's take a quick tour to help you get started. This will only take 2 minutes!
                </p>
                <p className="text-sm text-stone-400">
                    You can skip this tour anytime by clicking "Skip" or pressing ESC.
                </p>
            </div>
        ),
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">Your Dashboard</h4>
                <p className="text-sm text-stone-300">
                    Track your study time, XP, and sessions here. Your progress is automatically saved!
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="sangha"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">The Sangha (Communities)</h4>
                <p className="text-sm text-stone-300">
                    Join topic-specific study communities. Create or join servers for Physics, Math, UPSC, and more!
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="study-match"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">Study Match (Video Calls)</h4>
                <p className="text-sm text-stone-300">
                    Find random study partners for video sessions. Perfect for focused study time with accountability!
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="messages"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">Direct Messages</h4>
                <p className="text-sm text-stone-300">
                    Chat privately with your study buddies. Send text, voice messages, and share resources!
                </p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '[data-tour="profile"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">Your Profile</h4>
                <p className="text-sm text-stone-300">
                    Customize your profile, track your progress, and manage your account settings.
                </p>
            </div>
        ),
        placement: 'left',
    },
    {
        target: '[data-tour="help"]',
        content: (
            <div className="space-y-2">
                <h4 className="font-bold text-white">Need Help?</h4>
                <p className="text-sm text-stone-300">
                    Click here anytime for guides, FAQs, keyboard shortcuts, and troubleshooting tips.
                </p>
            </div>
        ),
        placement: 'left',
    },
    {
        target: 'body',
        content: (
            <div className="space-y-3 text-center">
                <h3 className="text-2xl font-bold text-white">You're All Set! 🚀</h3>
                <p className="text-stone-300">
                    You're ready to start your study journey on Gurukul. Happy studying!
                </p>
                <p className="text-sm text-stone-400">
                    Remember: You can always access the help page from the top-right corner.
                </p>
            </div>
        ),
        placement: 'center',
    },
]

export const tourStyles = {
    options: {
        arrowColor: '#1C1917',
        backgroundColor: '#1C1917',
        overlayColor: 'rgba(0, 0, 0, 0.8)',
        primaryColor: '#f97316',
        textColor: '#ffffff',
        width: 400,
        zIndex: 10000,
    },
    tooltip: {
        borderRadius: 16,
        padding: 20,
    },
    tooltipContainer: {
        textAlign: 'left' as const,
    },
    buttonNext: {
        backgroundColor: '#f97316',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 14,
        fontWeight: 600,
    },
    buttonBack: {
        color: '#a8a29e',
        marginRight: 10,
    },
    buttonSkip: {
        color: '#78716c',
    },
}
