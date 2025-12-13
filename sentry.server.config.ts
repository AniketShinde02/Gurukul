import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    tracesSampleRate: 0.1,

    enabled: process.env.NODE_ENV === 'production',

    // Server-side specific config
    integrations: [
        // Automatically instrument Node.js libraries and frameworks
    ],
});
