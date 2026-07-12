export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Fenjalbum",
  description: "Private self-hosted photo and video album"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
