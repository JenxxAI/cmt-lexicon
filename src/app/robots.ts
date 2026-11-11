import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";
import { siteBaseUrl } from "@/lib/site-origin";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: withBasePath("/") },
    sitemap: new URL("sitemap.xml", siteBaseUrl()).href,
  };
}
