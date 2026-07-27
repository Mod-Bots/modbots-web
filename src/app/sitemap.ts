import type { MetadataRoute } from "next";

const siteUrl = "https://modbots.ai";

const publicPaths = [
  "/",
  "/cookies",
  "/dataset-release",
  "/illegal-content-and-activity",
  "/moderation-and-appeals",
  "/privacy-notice",
  "/research-participation",
  "/room-rules",
  "/terms-of-use",
  "/why-mod-bots-exists",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
