import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteOrigin()).href,
  };
}
