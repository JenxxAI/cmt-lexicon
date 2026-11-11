import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  // Fully static site: deploy the `out/` folder anywhere (Vercel, Netlify, GitHub Pages).
  // A GitHub Pages project site lives under /<repository>/, so build it with
  // NEXT_PUBLIC_BASE_PATH=/<repository>. Unset, the site is served from the host root.
  // See docs/github-pages.md.
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
