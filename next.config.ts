import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  // Page HTML renders per request for fresh CSP nonces.
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
