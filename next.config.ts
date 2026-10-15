import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: deploy the `out/` folder anywhere (Vercel, GitHub Pages, Netlify).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
