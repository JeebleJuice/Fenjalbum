"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { IconButton } from "@/components/ui";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <IconButton aria-label="Toggle theme" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </IconButton>
  );
}
