import type { MetadataRoute } from "next";
import { buildLocaleAlternates, buildLocaleUrl } from "@/lib/seo/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = buildLocaleAlternates();

  return [
    {
      url: buildLocaleUrl("zh-CN"),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages,
      },
    },
    {
      url: buildLocaleUrl("en-US"),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages,
      },
    },
  ];
}
