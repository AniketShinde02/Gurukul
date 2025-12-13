import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production (0.1 = 10%)
    tracesSampleRate: 0.1,

    // Capture errors in production only
    enabled: process.env.NODE_ENV === 'production',

    // Ignore common errors that aren't actionable
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Network errors (user's connection issues)
        'NetworkError',
        'Failed to fetch',
        // Supabase realtime disconnects (expected when user closes tab)
        'WebSocket',
    ],

    // Add user context
    beforeSend(event, hint) {
        // Don't send events from localhost
        if (window.location.hostname === 'localhost') {
            return null;
        }
        return event;
    },
});
