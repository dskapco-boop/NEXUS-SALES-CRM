import { z } from "zod";

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),

  // Zoho MCP
  MCP_SERVER_URL: z.string().url().optional(),
  MCP_API_KEY: z.string().min(1).optional(),

  // PowerSync
  POWERSYNC_URL: z.string().url().optional(),
  POWERSYNC_TOKEN: z.string().min(1).optional(),

  // App
  APP_NAME: z.string().default("Nexus CRM"),
  APP_SCHEME: z.string().default("nexuscrm"),
  EXPO_PUBLIC_APP_URL: z.string().url().optional(),

  // Feature Flags
  ENABLE_OFFLINE: z.coerce.boolean().default(true),
  ENABLE_PUSH_NOTIFICATIONS: z.coerce.boolean().default(true),
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Reads environment variables from the appropriate source.
 * - Browser/Vite: import.meta.env (VITE_-prefixed vars auto-injected by Vite)
 * - Node.js/Edge Runtime: process.env
 */
function readEnv(): Record<string, string | undefined> {
  // Start with process.env (works in Node.js, Edge Functions, and Vercel/SSR)
  const envRecord: Record<string, string | undefined> = {};

  if (typeof process !== "undefined" && process.env) {
    const nodeEnv = process.env as Record<string, string | undefined>;
    for (const [key, value] of Object.entries(nodeEnv)) {
      envRecord[key] = value;
    }
  }

  // Browser/Vite: also check import.meta.env for VITE_-prefixed vars
  // Vite automatically strips the VITE_ prefix, so VITE_SUPABASE_URL becomes SUPABASE_URL
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteEnv = import.meta.env as Record<string, string | undefined>;
    for (const [key, value] of Object.entries(viteEnv)) {
      // Vite injects VITE_ prefixed vars WITHOUT the prefix
      if (value !== undefined) {
        envRecord[key] = value;
      }
    }
  }

  return envRecord;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(readEnv());
  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid environment configuration. Missing/invalid: ${missing}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env = getEnv();
