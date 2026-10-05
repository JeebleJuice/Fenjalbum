import { spawn } from "node:child_process";
import { loadLocalEnv } from "@/lib/load-env";

await loadLocalEnv(import.meta.url);

const child = spawn("npx", ["prisma", ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Prisma stopped by ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
