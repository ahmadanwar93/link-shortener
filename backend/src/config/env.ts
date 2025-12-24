import { z } from "zod";

// runtime check when env file first imported during startup
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().max(65535))
    .default(3000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .startsWith("postgresql://", "Must be a PostgreSQL connection string"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "Secret must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  FRONTEND_URL: z
    .string()
    .min(1, "FRONTEND_URL is required")
    .regex(/^https?:\/\//, "Must be a valid HTTP/HTTPS URL"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  const flattened = z.flattenError(parsed.error);
  console.error(flattened.fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
