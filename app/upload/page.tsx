export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/ui";
import { UploadDropzone } from "@/components/upload-dropzone";

export default async function UploadPage({
  searchParams
}: {
  searchParams: Promise<{ albumId?: string; returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { albumId, returnTo } = await searchParams;
  const album = albumId ? await prisma.album.findUnique({ where: { id: albumId } }) : null;
  return (
    <AppShell user={user}>
      <Panel className="overflow-hidden p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">Upload</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              {album ? `Upload into ${album.title}` : "Drop files, then jump straight back to the gallery."}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[hsl(var(--fg))]/65">
              Images and videos are uploaded privately, processed in the background, and shown in the gallery as soon as they land.
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-[linear-gradient(135deg,hsl(var(--fg))/0.04,transparent)] p-4">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/55">Button</div>
              <div className="mt-1 text-sm text-[hsl(var(--fg))]/65">Choose files opens the file picker.</div>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/55">Clear list</div>
              <div className="mt-1 text-sm text-[hsl(var(--fg))]/65">Clears the local queue view only.</div>
            </div>
            {album ? (
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <div className="text-xs uppercase tracking-wide text-[hsl(var(--fg))]/55">Target album</div>
                <div className="mt-1 text-sm font-medium">{album.title}</div>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>
      <UploadDropzone albumId={albumId} returnTo={returnTo ?? (albumId ? `/albums/${albumId}` : "/")} />
    </AppShell>
  );
}
