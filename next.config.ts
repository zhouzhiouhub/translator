import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow LAN / WSL host so client JS + HMR work when opening via 172.x instead of localhost
  allowedDevOrigins: ["172.26.64.1", "127.0.0.1", "localhost"],
};

export default withNextIntl(nextConfig);
