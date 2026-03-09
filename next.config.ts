import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/auth/* requests to Railway so cookies stay on localhost:3000.
        // This prevents the OAuth state_mismatch error caused by cross-domain cookies.
        source: '/api/auth/:path*',
        destination: 'https://najax-pos-production.up.railway.app/api/auth/:path*',
      },
    ]
  },
};

export default nextConfig;
