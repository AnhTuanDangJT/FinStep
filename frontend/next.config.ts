import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/finstep-logo.png", permanent: false },
    ];
  },
};

export default nextConfig;
