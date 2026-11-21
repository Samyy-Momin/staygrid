import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Self-contained server bundle for a small Docker image.
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
