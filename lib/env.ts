import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgresql://fenjalbum:fenjalbum@localhost:5432/fenjalbum?schema=public"),
  SESSION_SECRET: z.string().min(32).default("dev-secret-change-me-dev-secret-change-me"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("change-me-now"),
  ADMIN_NAME: z.string().default("Administrator"),
  MEDIA_ROOT: z.string().default("./data/media"),
  THUMB_ROOT: z.string().default("./data/thumbs"),
  POSTER_ROOT: z.string().default("./data/posters"),
  UPLOAD_TMP_ROOT: z.string().default("./data/tmp"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(1024),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
  MAX_CONCURRENT_UPLOADS: z.coerce.number().int().positive().default(6),
  TRUST_PROXY: z
    .union([z.literal("true"), z.literal("false"), z.string().transform((v) => v === "true")])
    .default(false),
  SEED_DEMO: z
    .union([z.literal("true"), z.literal("false"), z.string().transform((v) => v === "true")])
    .default(false)
});

export const env = schema.parse(process.env);
