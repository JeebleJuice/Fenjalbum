export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findLikelyUndatedDuplicates } from "@/lib/duplicate-media";
import { AppShell } from "@/components/app-shell";
import { AdminNavigation } from "@/components/admin-navigation";
import { DuplicateReview } from "@/components/duplicate-review";
import { Panel } from "@/components/ui";

export default async function DuplicateMediaPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();

  const [photos, pendingFingerprints] = await Promise.all([
    prisma.media.findMany({
      where: { mediaType: "PHOTO", trashedAt: null, perceptualHash: { not: null } },
      select: {
        id: true,
        originalFilename: true,
        perceptualHash: true,
        captureAt: true,
        width: true,
        height: true,
        uploadedAt: true,
        albums: { select: { album: { select: { title: true } } }, orderBy: { addedAt: "asc" } }
      }
    }),
    prisma.media.count({
      where: { mediaType: "PHOTO", processingStatus: "READY", trashedAt: null, perceptualHash: null }
    })
  ]);
  const pairs = findLikelyUndatedDuplicates(photos);
  const byId = new Map(photos.map((photo) => [photo.id, photo]));

  return (
    <AppShell user={user}>
      <Panel className="p-5">
        <h1 className="text-3xl font-semibold tracking-tight">Possible duplicates</h1>
        <p className="mt-2 max-w-3xl text-sm text-[hsl(var(--fg))]/65">
          Review metadata-free photos that closely resemble a dated photo. Merging keeps the dated copy, transfers its counterpart&apos;s organisation, and moves the counterpart to Trash.
        </p>
      </Panel>
      <AdminNavigation />
      {pendingFingerprints > 0 ? (
        <Panel className="p-4 text-sm text-[hsl(var(--fg))]/65">
          The worker is gently fingerprinting {pendingFingerprints} existing {pendingFingerprints === 1 ? "photo" : "photos"}. More matches may appear automatically.
        </Panel>
      ) : null}
      <DuplicateReview
        pairs={pairs.map((pair) => {
          const undated = byId.get(pair.undated.id)!;
          const dated = byId.get(pair.dated.id)!;
          return {
            distance: pair.distance,
            undated: {
              id: undated.id,
              filename: undated.originalFilename,
              albums: undated.albums.map((membership) => membership.album.title),
              uploadedAt: undated.uploadedAt.toISOString()
            },
            dated: {
              id: dated.id,
              filename: dated.originalFilename,
              albums: dated.albums.map((membership) => membership.album.title),
              captureAt: dated.captureAt!.toISOString()
            }
          };
        })}
      />
    </AppShell>
  );
}
