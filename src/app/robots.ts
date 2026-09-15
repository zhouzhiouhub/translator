import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo/urls";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/ai"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
