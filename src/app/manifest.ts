import type { MetadataRoute } from "next";
import { palette } from "../lib/application/shared/themes.ts";
import { siteMetadata } from "../lib/application/seo/siteMetadata.ts";

const manifest = async (): Promise<MetadataRoute.Manifest> => {
  return {
    dir: "ltr",
    start_url: "/",
    name: siteMetadata.name,
    short_name: siteMetadata.name,
    description: "Cited halal, haram, or unclear lookup. Named authorities. Both sides when they disagree.",

    display: "standalone",
    lang: "en",

    theme_color: palette.light.bg,
    background_color: palette.light.bg,
    icons: [
      { src: "/icons/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon_192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon_512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/web_app_manifest_512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    scope: "/",
  };
};

export default manifest;
