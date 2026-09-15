import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinolin.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Kinolin Translator",
  title: {
    default: "Kinolin Translator",
    template: "%s | Kinolin Translator",
  },
  openGraph: {
    type: "website",
    siteName: "Kinolin Translator",
    title: "Kinolin Translator",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "Kinolin Translator",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/brand/symbol.svg",
  },
};

/** Required by Next.js; document shell lives in `[locale]/layout`. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
