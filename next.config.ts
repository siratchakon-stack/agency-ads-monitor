import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["platform-lookaside.fbsbx.com", "graph.facebook.com"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
