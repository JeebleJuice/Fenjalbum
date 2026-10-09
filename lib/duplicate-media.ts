import { perceptualHashDistance } from "@/lib/perceptual-hash";

export type DuplicateCandidateMedia = {
  id: string;
  originalFilename: string;
  perceptualHash: string | null;
  captureAt: Date | null;
  width: number | null;
  height: number | null;
  uploadedAt: Date;
};

export type DuplicatePair = {
  undated: DuplicateCandidateMedia;
  dated: DuplicateCandidateMedia;
  distance: number;
};

function aspectRatio(item: DuplicateCandidateMedia) {
  return item.width && item.height
    ? Math.max(item.width, item.height) / Math.min(item.width, item.height)
    : null;
}

export function findLikelyUndatedDuplicates(items: DuplicateCandidateMedia[], maximumDistance = 5) {
  const dated = items.filter((item) => item.captureAt && item.perceptualHash);
  const undated = items.filter((item) => !item.captureAt && item.perceptualHash);

  return undated.flatMap((candidate): DuplicatePair[] => {
    const candidateRatio = aspectRatio(candidate);
    const matches = dated
      .map((known) => {
        const knownRatio = aspectRatio(known);
        const ratioDifference = candidateRatio && knownRatio
          ? Math.abs(candidateRatio - knownRatio) / Math.max(candidateRatio, knownRatio)
          : 0;
        return {
          dated: known,
          distance: perceptualHashDistance(candidate.perceptualHash!, known.perceptualHash!),
          ratioDifference
        };
      })
      .filter((match) => match.distance <= maximumDistance && match.ratioDifference <= 0.02)
      .sort((left, right) => left.distance - right.distance || left.dated.uploadedAt.getTime() - right.dated.uploadedAt.getTime());

    const best = matches[0];
    if (!best) return [];
    return [{ undated: candidate, dated: best.dated, distance: best.distance }];
  });
}
