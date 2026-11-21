import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (~small Docker image, no node_modules at runtime).
  output: "standalone",
  // Photos come from Cloudinary, which already resizes/compresses (see lib/img.ts),
  // so skip Next's image optimizer and its CPU cost on our server.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
