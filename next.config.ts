import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Seed rulings are imported as JSON modules, so they are bundled with each function.
  async redirects() {
    // Paths from before the boilerplate layout. 308 keeps POST bodies on the API.
    return [
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/api/verdict", destination: "/api/v1/verdict", permanent: true },
      { source: "/api/health", destination: "/api/v1/health", permanent: true },
    ];
  },
};

export default nextConfig;
