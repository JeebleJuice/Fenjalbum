import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        accentFg: "hsl(var(--accent-fg))",
        danger: "hsl(var(--danger))"
      },
      boxShadow: {
        soft: "0 24px 80px -24px rgba(0,0,0,0.35)"
      },
      backgroundImage: {
        "app-radial":
          "radial-gradient(circle at top, rgba(127, 110, 255, 0.16), transparent 34%), radial-gradient(circle at bottom right, rgba(84, 196, 255, 0.12), transparent 26%)"
      }
    }
  },
  plugins: []
} satisfies Config;
