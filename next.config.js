/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
  },

  // Optimize compilation speed
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

module.exports = nextConfig
