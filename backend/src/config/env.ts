import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  FRONTEND_URL: z.string().trim().url().optional(),
  CORS_ORIGINS: z.string().trim().optional(),
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
  FRONTEND_URL: process.env.FRONTEND_URL ?? process.env.APP_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  JWT_SECRET: process.env.AUTH_JWT_SECRET ?? process.env.JWT_SECRET
});

const databaseUrl = parseUrl("DATABASE_URL", parsedEnv.DATABASE_URL);
const directUrl = parsedEnv.DIRECT_URL ? parseUrl("DIRECT_URL", parsedEnv.DIRECT_URL) : undefined;
const appUrl = parsedEnv.FRONTEND_URL ? parseUrl("FRONTEND_URL", parsedEnv.FRONTEND_URL) : undefined;

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function parseOrigins(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => parseUrl("CORS_ORIGINS", origin).toString())
    .map(normalizeOrigin);
}

if (parsedEnv.NODE_ENV === "production") {
  if (appUrl && isLocalHostname(appUrl.hostname)) {
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
  FRONTEND_URL: appUrl?.toString(),
  DATABASE_URL: databaseUrl.toString(),
  DIRECT_URL: directUrl?.toString()
};

const localDevOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173"
];

export const allowedAppOrigins = Array.from(
  new Set([
    ...localDevOrigins,
    ...(appUrl ? [normalizeOrigin(appUrl.toString())] : []),
    ...parseOrigins(parsedEnv.CORS_ORIGINS)
  ])
);

const allowedOriginHosts = allowedAppOrigins
  .map((origin) => parseUrl("allowed origin", origin).hostname)
  .filter(Boolean);

const vercelPreviewPrefixes = Array.from(
  new Set(
    allowedOriginHosts
      .filter((host) => host.endsWith(".vercel.app"))
      .map((host) => host.split(".")[0])
      .filter(Boolean)
  )
);

export function isAllowedOrigin(origin?: string | null) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedAppOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(normalizedOrigin);

    if (!hostname.endsWith(".vercel.app") || protocol !== "https:") {
      return false;
    }

    return vercelPreviewPrefixes.some(
      (prefix) => hostname === `${prefix}.vercel.app` || hostname.startsWith(`${prefix}-`)
    );
  } catch {
    return false;
  }
}

export const databaseConfig = {
  runtimeHost: databaseUrl.host,
  directHost: directUrl?.host ?? null
};
