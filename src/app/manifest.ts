import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UNI Path — Your degree, mapped.",
    short_name: "UNI Path",
    description:
      "AI student progress advisor: see what's left, what to take next, and when you'll graduate.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4EEE3",
    theme_color: "#102A40",
    lang: "en",
    dir: "auto",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
