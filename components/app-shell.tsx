import { SidebarNavigation } from "@/components/sidebar-navigation";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export async function AppShell({
  user,
  children,
  viewport = false
}: {
  user: { name: string; email: string; role?: "ADMIN" | "USER" };
  children: React.ReactNode;
  viewport?: boolean;
}) {
  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, title: true }
  });
  return (
    <div className={cn(viewport ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <SidebarNavigation user={user} albums={albums} />
      <main
        className={cn(
          "mx-auto max-w-[1600px] lg:ml-72",
          viewport
            ? "h-[calc(100dvh-4rem)] overflow-hidden px-3 py-3 sm:px-4 md:px-6 lg:h-dvh lg:px-8 lg:py-5"
            : "space-y-5 px-4 pb-8 pt-5 md:px-6 lg:px-8 lg:pt-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
