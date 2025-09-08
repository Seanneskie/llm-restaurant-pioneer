import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  FSQ_API_KEY: z.string().min(1, "FSQ_API_KEY is required"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  API_CODE: z.string().min(1, "API_CODE is required"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse(process.env);

export function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Environment variable error: ${parsed.error.message}`);
  }
  return parsed.data;
}
