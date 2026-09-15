import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * `build` in package.json is `opennextjs-cloudflare build` so Cloudflare's
 * default `npm run build` produces `.open-next`. Point buildCommand at the
 * plain Next script to avoid recursion.
 */
const openNextConfig = {
  ...defineCloudflareConfig({}),
  buildCommand: "npm run build:next",
};

export default openNextConfig;
