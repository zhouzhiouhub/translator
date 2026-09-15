import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinolin.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/zh-CN`,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "zh-CN": `${siteUrl}/zh-CN`,
          "en-US": `${siteUrl}/en-US`,
        },
      },
    },
    {
      url: `${siteUrl}/en-US`,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "zh-CN": `${siteUrl}/zh-CN`,
          "en-US": `${siteUrl}/en-US`,
        },
      },
    },
  ];
}