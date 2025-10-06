import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Fix for Turbopack font loading issues in Next.js 15.5.3
  turbopack: {
    rules: {
      // Use webpack for font-related modules to avoid Turbopack issues
      '**/node_modules/next/font/**': {
        loaders: ['$web-resource'],
        as: '*.js',
      },
    },
  },
  // Configure allowed image hostnames for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gccfauxgqyfxoxqwcaia.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
