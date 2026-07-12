import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("s3cret-password");
    await expect(verifyPassword("s3cret-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
