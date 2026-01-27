import { z } from "zod";

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),
  VITE_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
  MODE: z.string().default("development"),
});

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const env = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_ENV: import.meta.env.VITE_ENV || import.meta.env.MODE || "development",
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
});

/**
 * Check if running in development mode
 */
export const isDevelopment = env.VITE_ENV === "development" || env.DEV;

/**
 * Check if running in production mode
 */
export const isProduction = env.VITE_ENV === "production" || env.PROD;

/**
 * Check if running in staging mode
 */
export const isStaging = env.VITE_ENV === "staging";
