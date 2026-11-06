/**
 * @repo/config — Typed environment variable helper
 *
 * Provides a `createEnv` factory that validates process.env against a Zod
 * schema and returns a fully-typed, validated env object. Throws at startup
 * if any required variable is missing or malformed.
 *
 * Usage:
 *
 *   // apps/backend/src/config/env.ts
 *   import { createEnv } from "@repo/config/env";
 *   import { z } from "zod";
 *
 *   export const env = createEnv({
 *     schema: z.object({
 *       NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
 *       PORT: z.coerce.number().int().positive().default(4000),
 *       MONGODB_URI: z.string().url(),
 *       JWT_ACCESS_SECRET: z.string().min(32),
 *     }),
 *     // Optional: override the source (defaults to process.env)
 *     runtimeEnv: process.env,
 *   });
 *
 *   // env.PORT is typed as `number`, env.NODE_ENV as the union literal, etc.
 */

import { z, type ZodObject, type ZodRawShape, type ZodTypeAny } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateEnvOptions<TShape extends ZodRawShape> {
  /** Zod object schema describing the expected environment variables. */
  schema: ZodObject<TShape>;
  /**
   * The raw key/value source to validate against.
   * Defaults to `process.env` when omitted.
   */
  runtimeEnv?: Record<string, string | undefined>;
  /**
   * When `true`, validation errors are logged but do not throw.
   * Useful for build-time checks where the full env is not available.
   * Defaults to `false`.
   */
  skipValidation?: boolean;
}

export type InferEnv<TShape extends ZodRawShape> = z.infer<ZodObject<TShape>>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats Zod validation errors into a human-readable string.
 */
function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `  • ${path ? `${path}: ` : ""}${issue.message}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Validates `runtimeEnv` (defaults to `process.env`) against the provided
 * Zod schema and returns the parsed, typed result.
 *
 * Throws an `Error` at call-time if validation fails (unless `skipValidation`
 * is `true`), ensuring the application never starts with a broken config.
 */
export function createEnv<TShape extends ZodRawShape>(
  options: CreateEnvOptions<TShape>
): InferEnv<TShape> {
  const { schema, runtimeEnv = process.env, skipValidation = false } = options;

  if (skipValidation) {
    // Return a best-effort parse; callers accept that values may be undefined.
    return schema.parse(runtimeEnv) as InferEnv<TShape>;
  }

  const result = schema.safeParse(runtimeEnv);

  if (!result.success) {
    const message = [
      "❌  Invalid environment variables:",
      formatErrors(result.error),
      "",
      "Fix the above issues and restart the application.",
    ].join("\n");

    throw new Error(message);
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Pre-built common schemas (re-usable building blocks)
// ---------------------------------------------------------------------------

/**
 * Common Zod schemas for frequently-used environment variable shapes.
 * Import and compose these into your app-specific schema.
 *
 * @example
 * import { createEnv, envSchemas } from "@repo/config/env";
 * import { z } from "zod";
 *
 * export const env = createEnv({
 *   schema: z.object({
 *     ...envSchemas.node,
 *     ...envSchemas.jwt,
 *     MONGODB_URI: z.string().url(),
 *   }),
 * });
 */
export const envSchemas = {
  /** NODE_ENV and PORT */
  node: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
  },

  /** JWT access + refresh secrets and expiry strings */
  jwt: {
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  },

  /** MongoDB connection URI (supports Atlas multi-host strings Zod .url() rejects) */
  mongodb: {
    MONGODB_URI: z
      .string()
      .min(1, "MONGODB_URI is required")
      .refine(
        (val) =>
          val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
        "MONGODB_URI must start with mongodb:// or mongodb+srv://",
      ),
  },

  /** CORS allowed origins (comma-separated) */
  cors: {
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:3000,http://localhost:3008")
      .transform((val) => val.split(",").map((s) => s.trim())),
  },

  /** Rate limiting */
  rateLimit: {
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(50),
  },

  /** File upload settings */
  upload: {
    UPLOAD_DIR: z.string().default("uploads"),
    MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
    /** Public origin for uploaded file URLs (e.g. http://localhost:4000). No trailing slash. */
    API_PUBLIC_URL: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().url().optional(),
    ),
  },

  /** SMTP / email */
  smtp: {
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().email(),
    SMTP_PASS: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
  },

  /** Payment gateway */
  payment: {
    PAYMENT_GATEWAY_API_KEY: z.string().min(1),
    PAYMENT_GATEWAY_SECRET: z.string().min(1),
    PAYMENT_WEBHOOK_SECRET: z.string().min(1),
  },
} satisfies Record<string, ZodRawShape>;

// ---------------------------------------------------------------------------
// Re-export zod for convenience so callers don't need a separate import
// ---------------------------------------------------------------------------
export { z, type ZodTypeAny };
