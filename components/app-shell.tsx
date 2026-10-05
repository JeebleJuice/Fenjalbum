import { SidebarNavigation } from "@/components/sidebar-navigation";

export function AppShell({
  user,
  children
}: {
  user: { name: string; email: string; role?: "ADMIN" | "USER" };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <SidebarNavigation user={user} />
      <main className="mx-auto max-w-[1600px] space-y-5 px-4 pb-8 pt-5 md:px-6 lg:ml-72 lg:px-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
