"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { AlbumMediaPicker } from "@/components/album-media-picker";
import { Button, Panel } from "@/components/ui";

type PickerItem = {
  id: string;
  title: string | null;
  originalFilename: string;
  mediaType: "PHOTO" | "VIDEO";
  thumbSrc: string | null;
  uploadedAt: string;
  albumTitle: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
};

export function AlbumPageActions({
  albumId,
  albumTitle,
  pickerItems
}: {
  albumId: string;
  albumTitle: string;
  pickerItems: PickerItem[];
}) {
  const [open, setOpen] = useState(false);
  const uploadHref = `/upload?albumId=${encodeURIComponent(albumId)}&returnTo=${encodeURIComponent(`/albums/${albumId}`)}`;

  return (
    <>
      <div className="flex gap-2">
        <Button asChild>
          <Link href={uploadHref}>Add media</Link>
        </Button>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Existing media
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/55 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-center">
            <Panel className="relative max-h-[92vh] w-full overflow-auto bg-[hsl(var(--bg))] p-0">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-[hsl(var(--fg))]/55">Existing media</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">Add gallery items to {albumTitle}</h2>
                </div>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
              <div className="p-5">
                <AlbumMediaPicker albumId={albumId} albumTitle={albumTitle} items={pickerItems} />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}
