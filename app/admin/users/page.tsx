export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";
import { UserCreateForm } from "@/components/user-create-form";

export default async function UsersPage() {
  const user = await getCurrentUser(); if (!user || user.role !== "ADMIN") notFound();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return <AppShell user={user}><Panel className="p-5"><h1 className="text-3xl font-semibold">Household accounts</h1><p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Everyone shares the same family library. Administrators manage accounts and permanent deletion.</p></Panel><UserCreateForm/><div className="grid gap-3">{users.map((item) => <Panel key={item.id} className="flex justify-between p-4"><div><div className="font-medium">{item.name}</div><div className="text-sm text-[hsl(var(--fg))]/60">{item.email}</div></div><div className="text-xs uppercase tracking-wide">{item.role}</div></Panel>)}</div></AppShell>;
}
