import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Fenjalbum", short_name: "Fenjalbum", description: "Private family photo and video archive", start_url: "/", scope: "/", display: "standalone", background_color: "#101426", theme_color: "#101426", orientation: "any", categories: ["photo", "lifestyle"], icons: [{ src: "/icons/fenjalbum-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { src: "/icons/fenjalbum-512.png", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/icons/fenjalbum-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}
