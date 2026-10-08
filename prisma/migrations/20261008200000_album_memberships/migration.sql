-- Allow a media item to belong to multiple albums while preserving every
-- existing single-album assignment and its order.
CREATE TABLE "AlbumMedia" (
    "albumId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "albumOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumMedia_pkey" PRIMARY KEY ("albumId", "mediaId")
);

INSERT INTO "AlbumMedia" ("albumId", "mediaId", "albumOrder")
SELECT "albumId", "id", "albumOrder"
FROM "Media"
WHERE "albumId" IS NOT NULL;

CREATE INDEX "AlbumMedia_mediaId_idx" ON "AlbumMedia"("mediaId");
CREATE INDEX "AlbumMedia_albumId_albumOrder_idx" ON "AlbumMedia"("albumId", "albumOrder");

ALTER TABLE "AlbumMedia"
ADD CONSTRAINT "AlbumMedia_albumId_fkey"
FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlbumMedia"
ADD CONSTRAINT "AlbumMedia_mediaId_fkey"
FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Media_albumId_albumOrder_idx";
ALTER TABLE "Media" DROP CONSTRAINT "Media_albumId_fkey";
ALTER TABLE "Media" DROP COLUMN "albumId", DROP COLUMN "albumOrder";
