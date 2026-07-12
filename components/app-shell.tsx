import Link from "next/link";
import { Heart, Images, SquareArrowOutUpRight, Upload, Album, Shield, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Input } from "@/components/ui";

const nav = [
  { href: "/", label: "Gallery", icon: Images },
  { href: "/albums", label: "Albums", icon: Album },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function AppShell({
  user,
  children,
  searchPlaceholder = "Search your library"
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
  searchPlaceholder?: string;
}) {
  return (
    <div className="app-container space-y-5">
      <header className="glass rounded-[2rem] border border-[hsl(var(--border))] px-5 py-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--fg)))] text-[hsl(var(--accent-fg))] shadow-lg shadow-black/10">
              <SquareArrowOutUpRight className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Fenjalbum</div>
              <div className="text-sm text-[hsl(var(--fg))]/60">Private photo and video archive</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-[22rem]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--fg))]/45" />
              <Input placeholder={searchPlaceholder} className="pl-10" readOnly />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
        </div>
        <nav className="mt-5 flex flex-wrap gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-[hsl(var(--muted))] hover:shadow-md"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="space-y-5">{children}</main>
    </div>
  );
}
