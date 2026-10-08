export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";
import { PwaRegister } from "@/components/pwa-register";
import "leaflet/dist/leaflet.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Fenjalbum",
  description: "Private self-hosted photo and video album",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Fenjalbum" },
  icons: { icon: "/icons/fenjalbum-192.png", apple: "/icons/fenjalbum-180.png" }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>{children}<PwaRegister /></ThemeProvider>
      </body>
    </html>
  );
}
