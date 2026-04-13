import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  FRONTEND_URL: z.string().trim().url(),
  DATABASE_URL: z.string().trim().min(1),
  DIRECT_URL: z.string().trim().min(1).optional(),
  JWT_SECRET: z.string().min(10)
});

function parseUrl(name: string, value: string) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`[env] ${name} must be a valid URL.`);
  }
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL ?? process.env.APP_URL ?? "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET
});

const appUrl = parseUrl("FRONTEND_URL", parsedEnv.FRONTEND_URL);
const databaseUrl = parseUrl("DATABASE_URL", parsedEnv.DATABASE_URL);
const directUrl = parsedEnv.DIRECT_URL ? parseUrl("DIRECT_URL", parsedEnv.DIRECT_URL) : undefined;

if (parsedEnv.NODE_ENV === "production") {
  if (isLocalHostname(appUrl.hostname)) {
    throw new Error("[env] FRONTEND_URL cannot point to localhost in production.");
  }

  if (isLocalHostname(databaseUrl.hostname)) {
    throw new Error("[env] DATABASE_URL cannot point to localhost in production.");
  }

  if (directUrl && isLocalHostname(directUrl.hostname)) {
    throw new Error("[env] DIRECT_URL cannot point to localhost in production.");
  }
}

export const env = {
  ...parsedEnv,
  FRONTEND_URL: appUrl.toString(),
  DATABASE_URL: databaseUrl.toString(),
  DIRECT_URL: directUrl?.toString()
};

export const allowedAppOrigins = Array.from(
  new Set(
    [appUrl.toString()]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\/+$/, ""))
  )
);

export const databaseConfig = {
  runtimeHost: databaseUrl.host,
  directHost: directUrl?.host ?? null
};
