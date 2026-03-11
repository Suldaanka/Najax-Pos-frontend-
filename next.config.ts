import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "https://najax-pos-production.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
