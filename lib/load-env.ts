import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseEnv(content: string) {
  const parsed: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key) parsed[key] = value;
  }
  return parsed;
}

async function loadEnvFile(filePath: string, overwrite = false) {
  const content = await readFile(filePath, "utf8").catch(() => "");
  if (!content) return;
  const parsed = parseEnv(content);
  for (const [key, value] of Object.entries(parsed)) {
    if (overwrite || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export async function loadLocalEnv(baseUrl: string) {
  const rootDir = path.resolve(path.dirname(fileURLToPath(baseUrl)), "..");
  await loadEnvFile(path.join(rootDir, ".env"));
  await loadEnvFile(path.join(rootDir, ".env.local"), true);
}
