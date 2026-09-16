import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const isDevelopment = process.env.NODE_ENV === "development";
const developmentScriptPolicy =
  isDevelopment ? " 'unsafe-eval'" : "";
const developmentConnectPolicy = isDevelopment
  ? " http://localhost:* http://127.0.0.1:*"
  : "";
const productionPolicy = isDevelopment ? "" : "; upgrade-insecure-requests";

const nextConfig: NextConfig = {
  // Allow LAN / WSL host so client JS + HMR work when opening via 172.x instead of localhost
  allowedDevOrigins: ["172.26.64.1", "127.0.0.1", "localhost"],
  turbopack: {
    resolveAlias: {
      "next/dist/build/polyfills/polyfill-module":
        "./src/polyfills/modern-browser-noop.ts",
      "../build/polyfills/polyfill-module":
        "./src/polyfills/modern-browser-noop.ts",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${developmentScriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: ${developmentConnectPolicy}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'${productionPolicy}`,
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
