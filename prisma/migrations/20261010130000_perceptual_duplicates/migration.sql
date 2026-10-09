ALTER TABLE "Media" ADD COLUMN "perceptualHash" TEXT;

CREATE INDEX "Media_perceptualHash_idx" ON "Media"("perceptualHash");
CREATE INDEX "Media_trashedAt_captureAt_idx" ON "Media"("trashedAt", "captureAt");
CREATE INDEX "Media_trashedAt_uploadedAt_id_idx" ON "Media"("trashedAt", "uploadedAt", "id");
CREATE INDEX "Media_trashedAt_favorite_captureAt_idx" ON "Media"("trashedAt", "favorite", "captureAt");
