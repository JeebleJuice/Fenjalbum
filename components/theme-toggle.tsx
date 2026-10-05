"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useSyncExternalStore } from "react";
import { IconButton } from "@/components/ui";

const themeEvent = "fenjalbum-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(themeEvent, onStoreChange);
  return () => window.removeEventListener(themeEvent, onStoreChange);
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fenjalbum-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <IconButton aria-label={`Use ${dark ? "light" : "dark"} theme`} onClick={toggle}>
      {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </IconButton>
  );
}
