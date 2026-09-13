import { z } from "zod";
const envSchema = z.object({ NODE_ENV: z.enum(["development", "test", "production"]).default("development"), NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"), DATABASE_URL: z.string().url(), NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1), CLERK_SECRET_KEY: z.string().min(1), CREDENTIAL_ENCRYPTION_KEY: z.string().min(32), INNGEST_EVENT_KEY: z.string().optional(), INNGEST_SIGNING_KEY: z.string().optional(), REDIS_URL: z.string().url().optional() });
export type AppConfig = z.infer<typeof envSchema> & { isProduction: boolean };
let cachedConfig: AppConfig | undefined;
export function getConfig(): AppConfig { if (!cachedConfig) { const parsed = envSchema.safeParse(process.env); if (!parsed.success) throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((x) => x.path.join(".")).join(", ")}`); cachedConfig = { ...parsed.data, isProduction: parsed.data.NODE_ENV === "production" }; } return cachedConfig; }
