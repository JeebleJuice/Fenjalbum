"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("fenjalbum-theme");
    const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    root.style.colorScheme = dark ? "dark" : "light";
    window.dispatchEvent(new Event("fenjalbum-theme-change"));
  }, []);

  return children;
}
