import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Seed rulings are imported as JSON modules, so they are bundled with each function.
};

export default nextConfig;
