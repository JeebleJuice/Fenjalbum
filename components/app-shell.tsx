import { SidebarNavigation } from "@/components/sidebar-navigation";
import { prisma } from "@/lib/db";

export async function AppShell({
  user,
  children
}: {
  user: { name: string; email: string; role?: "ADMIN" | "USER" };
  children: React.ReactNode;
}) {
  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, title: true }
  });
  return (
    <div className="min-h-dvh">
      <SidebarNavigation user={user} albums={albums} />
      <main className="mx-auto max-w-[1600px] space-y-5 px-4 pb-8 pt-5 md:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
