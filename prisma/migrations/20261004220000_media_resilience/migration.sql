ALTER TABLE "Media"
ADD COLUMN "playbackPath" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "trashedAt" TIMESTAMP(3);

CREATE INDEX "Media_trashedAt_idx" ON "Media"("trashedAt");
