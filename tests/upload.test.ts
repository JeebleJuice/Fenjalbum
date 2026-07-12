import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateUploadedFile } from "@/lib/upload";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6eJb0AAAAASUVORK5CYII=";

describe("upload validation", () => {
  it("accepts a valid png and rejects plain text", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fenjalbum-test-"));
    const pngPath = path.join(dir, "image.png");
    const txtPath = path.join(dir, "text.txt");
    await fs.writeFile(pngPath, Buffer.from(pngBase64, "base64"));
    await fs.writeFile(txtPath, "hello");
    await expect(validateUploadedFile(pngPath)).resolves.toMatchObject({ mime: "image/png" });
    await expect(validateUploadedFile(txtPath)).rejects.toThrow("Unsupported file type");
  });
});
