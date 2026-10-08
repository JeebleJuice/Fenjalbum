import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import { loadLocalEnv } from "@/lib/load-env";

await loadLocalEnv(import.meta.url);

const { PrismaClient } = await import("@prisma/client");
const { env } = await import("@/lib/env");
const { ensureStorageRoots } = await import("@/lib/storage");

const prisma = new PrismaClient();

async function createDemoAssets() {
  if (!env.SEED_DEMO) return;
  await ensureStorageRoots();
  const demoDir = path.join(env.MEDIA_ROOT, "_seed");
  await mkdir(demoDir, { recursive: true });
  const imagePath = path.join(demoDir, "demo-photo.jpg");
  const posterPath = path.join(demoDir, "demo-poster.jpg");
  const thumbPath = path.join(demoDir, "demo-thumb.jpg");
  const img = sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: { r: 18, g: 24, b: 38 }
    }
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="1600" height="1200" rx="64" fill="#121826"/><text x="96" y="200" fill="#eef2ff" font-size="92" font-family="Arial">Fenjalbum</text><text x="96" y="286" fill="#9ca3af" font-size="42" font-family="Arial">Private media archive seed</text></svg>`
        ),
        top: 0,
        left: 0
      }
    ])
    .jpeg({ quality: 92 });
  await img.toFile(imagePath);
  await sharp(imagePath).resize(480, 360, { fit: "cover" }).jpeg({ quality: 84 }).toFile(thumbPath);
  await sharp(imagePath).resize(1280, 960, { fit: "inside" }).jpeg({ quality: 90 }).toFile(posterPath);
  return { imagePath, thumbPath, posterPath };
}

async function main() {
  const userCount = await prisma.user.count();
  if (userCount === 0 && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: env.ADMIN_EMAIL,
        name: env.ADMIN_NAME,
        passwordHash,
        role: "ADMIN"
      }
    });
  }

  if (env.SEED_DEMO) {
    const existingAlbums = await prisma.album.count();
    if (existingAlbums === 0) {
      const demo = await createDemoAssets();
      const album = await prisma.album.create({
        data: {
          title: "Demo Album",
          description: "Sample media created by seed mode."
        }
      });
      if (demo) {
        const media = await prisma.media.create({
          data: {
            originalFilename: "demo-photo.jpg",
            safeFilename: "demo-photo.jpg",
            title: "Demo Photo",
            description: "Generated for local development.",
            mediaType: "PHOTO",
            mimeType: "image/jpeg",
            size: BigInt(0),
            width: 1600,
            height: 1200,
            hash: "demo-photo-hash",
            storagePath: demo.imagePath,
            thumbPath: demo.thumbPath,
            posterPath: demo.posterPath,
            processingStatus: "READY",
            albums: { create: { albumId: album.id, albumOrder: 0 } }
          }
        });
        await prisma.album.update({
          where: { id: album.id },
          data: { coverMediaId: media.id }
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
