export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";
import Link from "next/link";
import { RetryJobButton } from "@/components/retry-job-button";

export default async function AdminMediaPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  const media = await prisma.media.findMany({
    orderBy: [{ uploadedAt: "desc" }],
    include: { album: true },
    take: 100
  });
  const failedJobs = await prisma.processingJob.findMany({
    where: { status: "FAILED" },
    orderBy: [{ updatedAt: "desc" }],
    include: { media: true },
    take: 10
  });
  return (
    <AppShell user={user}>
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Media</h1>
        <p className="mt-2 text-sm text-[hsl(var(--fg))]/65">Recent items and quick actions.</p>
      </Panel>
      <div className="grid gap-3">
        {media.map((item) => (
          <Panel key={item.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <Link href={`/media/${item.id}`} className="block truncate font-medium">
                {item.title ?? item.originalFilename}
              </Link>
              <div className="truncate text-sm text-[hsl(var(--fg))]/60">
                {item.mediaType} · {item.album?.title ?? "No album"} · {item.processingStatus}
              </div>
            </div>
            <div className="text-xs text-[hsl(var(--fg))]/55">{new Date(item.uploadedAt).toLocaleString()}</div>
          </Panel>
        ))}
      </div>
      <Panel className="p-5">
        <h2 className="text-xl font-semibold">Failed processing jobs</h2>
        <div className="mt-4 grid gap-3">
          {failedJobs.length ? failedJobs.map((job) => (
            <div key={job.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[hsl(var(--border))] p-4">
              <div className="min-w-0">
                <div className="font-medium">{job.media.title ?? job.media.originalFilename}</div>
                <div className="text-sm text-[hsl(var(--fg))]/60">{job.kind} · {job.lastError ?? "Unknown error"}</div>
              </div>
              <RetryJobButton jobId={job.id} />
            </div>
          )) : <p className="text-sm text-[hsl(var(--fg))]/60">No failed jobs.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
