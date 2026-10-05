import { open } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";

export async function fileTypeFromPath(filePath: string) {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return fileTypeFromBuffer(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
