/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  experimental: {
    optimizePackageImports: [
      '@livekit/components-react',
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-tooltip',
    ],
  },
}

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withNextra(withSentryConfig(nextConfig, {
  org: "gurukul-rv",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  automaticVercelMonitors: true,
}));
