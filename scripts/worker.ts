import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadLocalEnv } from "@/lib/load-env";

await loadLocalEnv(import.meta.url);

const execFileAsync = promisify(execFile);

async function runMigrations() {
  await execFileAsync("npx", ["prisma", "migrate", "deploy"], {
    env: process.env,
    maxBuffer: 1024 * 1024 * 10
  });
}

await runMigrations();

const { prisma } = await import("@/lib/db");
const { processMediaJob } = await import("@/lib/media-processing");

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_MS ?? 2500);

let stopped = false;

async function claimJob() {
  const job = await prisma.processingJob.findFirst({
    where: {
      status: "PENDING",
      runAfter: { lte: new Date() }
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  });

  if (!job) return null;

  const result = await prisma.processingJob.updateMany({
    where: { id: job.id, status: "PENDING" },
    data: { status: "RUNNING", attempts: { increment: 1 } }
  });

  return result.count === 1 ? job : null;
}

async function runJobLoop() {
  while (!stopped) {
    const job = await claimJob();
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      continue;
    }

    try {
      await processMediaJob(job.mediaId);
      await prisma.processingJob.update({
        where: { id: job.id },
        data: { status: "DONE", lastError: null }
      });
    } catch (error) {
      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "processing failed"
        }
      });
    }
  }
}

async function main() {
  await prisma.processingJob.updateMany({
    where: { status: "RUNNING" },
    data: { status: "PENDING", runAfter: new Date(), lastError: "Recovered after worker restart" }
  });
  process.on("SIGINT", () => {
    stopped = true;
  });
  process.on("SIGTERM", () => {
    stopped = true;
  });

  console.log(`Fenjalbum worker polling every ${POLL_INTERVAL_MS}ms`);
  await runJobLoop();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
