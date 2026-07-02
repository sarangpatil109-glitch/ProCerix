import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url("Must be a valid URL").optional().default("http://localhost:3000"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Service role key is required").optional(),

  // Cashfree — either CASHFREE_ENV or NEXT_PUBLIC_CASHFREE_ENV can be set to "PRODUCTION"
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(["SANDBOX", "PRODUCTION"]).default("SANDBOX"),
  NEXT_PUBLIC_CASHFREE_ENV: z.enum(["SANDBOX", "PRODUCTION"]).optional(),
  // Override return_url base for local dev with production Cashfree credentials
  CASHFREE_RETURN_URL_BASE: z.string().url().optional(),

  // AI & Processing
  GEMINI_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const _parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY,
  CASHFREE_ENV: process.env.CASHFREE_ENV,
  NEXT_PUBLIC_CASHFREE_ENV: process.env.NEXT_PUBLIC_CASHFREE_ENV,
  CASHFREE_RETURN_URL_BASE: process.env.CASHFREE_RETURN_URL_BASE,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (!_parsed.success) {
  console.error(
    "[env] Missing or invalid environment variables:\n" +
    _parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")
  );
}

export const env = _parsed.success ? _parsed.data : (process.env as any);
