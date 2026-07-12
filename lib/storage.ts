import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export async function ensureStorageRoots() {
  await Promise.all([env.MEDIA_ROOT, env.THUMB_ROOT, env.POSTER_ROOT, env.UPLOAD_TMP_ROOT].map((dir) => mkdir(dir, { recursive: true })));
}

export function mediaDir(id: string) {
  return path.join(env.MEDIA_ROOT, id);
}

export function mediaOriginalPath(id: string, filename: string) {
  return path.join(mediaDir(id), filename);
}

export function mediaThumbPath(id: string, filename = "thumb.jpg") {
  return path.join(env.THUMB_ROOT, id, filename);
}

export function mediaPosterPath(id: string, filename = "poster.jpg") {
  return path.join(env.POSTER_ROOT, id, filename);
}

export function tempUploadPath(id: string, filename: string) {
  return path.join(env.UPLOAD_TMP_ROOT, `${id}-${filename}`);
}

export async function removeTree(target: string) {
  await rm(target, { recursive: true, force: true });
}
