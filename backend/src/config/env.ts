import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const NODE_ENV_VALUES = ["development", "test", "production"] as const;

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function formatEnvIssues(issues: string[]) {
  return `[env] Invalid environment configuration:\n${issues.map((issue) => `- ${issue}`).join("\n")}`;
}

function failEnv(issues: string[]): never {
  throw new Error(formatEnvIssues(issues));
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function parseNodeEnv(rawValue: string | undefined) {
  const value = rawValue?.trim() || "development";

  if (NODE_ENV_VALUES.includes(value as (typeof NODE_ENV_VALUES)[number])) {
    return value as (typeof NODE_ENV_VALUES)[number];
  }

  failEnv([
    `NODE_ENV must be one of: ${NODE_ENV_VALUES.join(", ")}. Received "${rawValue ?? ""}".`,
  ]);
}

function parsePort(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return 3333;
  }

  const value = Number(rawValue);

  if (Number.isInteger(value) && value >= 1 && value <= 65535) {
    return value;
  }

  failEnv([`PORT must be an integer between 1 and 65535. Received "${rawValue}".`]);
}

function parseRequiredString(name: string, rawValue: string | undefined) {
  const value = rawValue?.trim();

  if (!value) {
    failEnv([`${name} is required and cannot be empty.`]);
  }

  return value;
}

function ensureSupportedUrl(name: string, url: URL) {
  if (!["http:", "https:", "postgres:", "postgresql:", "prisma:"].includes(url.protocol)) {
    failEnv([`${name} uses unsupported protocol "${url.protocol}".`]);
  }
}

function parseUrl(name: string, rawValue: string | undefined) {
  const value = parseRequiredString(name, rawValue);
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    failEnv([`${name} must be a valid URL. Received "${rawValue ?? ""}".`]);
  }

  ensureSupportedUrl(name, url);
  return url;
}

function parseOptionalOrigin(name: string, rawValue: string | undefined) {
  const value = rawValue?.trim();

  if (!value) {
    return undefined;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    failEnv([`${name} must be a valid origin URL. Received "${rawValue ?? ""}".`]);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    failEnv([`${name} must use http or https. Received "${value}".`]);
  }

  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    failEnv([`${name} must contain only the site origin, without path, query, hash, or credentials. Received "${value}".`]);
  }

  return normalizeOrigin(url.origin);
}

function parseCorsOrigins(rawValue: string | undefined) {
  if (!rawValue?.trim()) {
    return [];
  }

  const issues: string[] = [];
  const normalizedOrigins = rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      let url: URL;

      try {
        url = new URL(origin);
      } catch {
        issues.push(`CORS_ORIGINS entry "${origin}" is not a valid URL.`);
        return [];
      }

      if (!["http:", "https:"].includes(url.protocol)) {
        issues.push(`CORS_ORIGINS entry "${origin}" must use http or https.`);
        return [];
      }

      if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
        issues.push(`CORS_ORIGINS entry "${origin}" must be only an origin, without path, query, hash, or credentials.`);
        return [];
      }

      return [normalizeOrigin(url.origin)];
    });

  if (issues.length > 0) {
    failEnv(issues);
  }

  return Array.from(new Set(normalizedOrigins));
}

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL ?? process.env.APP_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  JWT_SECRET: process.env.AUTH_JWT_SECRET ?? process.env.JWT_SECRET,
};

const jwtSecretSchema = z.string().min(10, "JWT_SECRET must have at least 10 characters.");
const jwtSecretResult = jwtSecretSchema.safeParse(rawEnv.JWT_SECRET?.trim() ?? "");

if (!jwtSecretResult.success) {
  failEnv(jwtSecretResult.error.issues.map((issue) => issue.message));
}

const NODE_ENV = parseNodeEnv(rawEnv.NODE_ENV);
const PORT = parsePort(rawEnv.PORT);
const DATABASE_URL = parseUrl("DATABASE_URL", rawEnv.DATABASE_URL).toString();
const DIRECT_URL = parseUrl("DIRECT_URL", rawEnv.DIRECT_URL).toString();
const FRONTEND_URL = parseOptionalOrigin("FRONTEND_URL", rawEnv.FRONTEND_URL);
const configuredCorsOrigins = parseCorsOrigins(rawEnv.CORS_ORIGINS);

const databaseUrl = new URL(DATABASE_URL);
const directUrl = new URL(DIRECT_URL);

if (NODE_ENV === "production") {
  const issues: string[] = [];

  if (FRONTEND_URL) {
    const frontendUrl = new URL(FRONTEND_URL);

    if (isLocalHostname(frontendUrl.hostname)) {
      issues.push("FRONTEND_URL cannot point to localhost or 127.0.0.1 in production.");
    }
  }

  if (isLocalHostname(databaseUrl.hostname)) {
    issues.push("DATABASE_URL cannot point to localhost or 127.0.0.1 in production.");
  }

  if (isLocalHostname(directUrl.hostname)) {
    issues.push("DIRECT_URL cannot point to localhost or 127.0.0.1 in production.");
  }

  if (issues.length > 0) {
    failEnv(issues);
  }
}

const localDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export const allowedAppOrigins = Array.from(
  new Set([
    ...localDevOrigins.map(normalizeOrigin),
    ...(FRONTEND_URL ? [FRONTEND_URL] : []),
    ...configuredCorsOrigins,
  ]),
);

const allowedOriginHosts = allowedAppOrigins
  .map((origin) => new URL(origin).hostname)
  .filter(Boolean);

const vercelPreviewPrefixes = Array.from(
  new Set(
    allowedOriginHosts
      .filter((host) => host.endsWith(".vercel.app"))
      .map((host) => host.split(".")[0])
      .filter(Boolean),
  ),
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
    const parsed = new URL(normalizedOrigin);

    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel.app")) {
      return false;
    }

    return vercelPreviewPrefixes.some(
      (prefix) =>
        parsed.hostname === `${prefix}.vercel.app` || parsed.hostname.startsWith(`${prefix}-`),
    );
  } catch {
    return false;
  }
}

export const env = {
  NODE_ENV,
  PORT,
  FRONTEND_URL,
  CORS_ORIGINS: configuredCorsOrigins,
  DATABASE_URL,
  DIRECT_URL,
  JWT_SECRET: jwtSecretResult.data,
};

export const databaseConfig = {
  runtimeHost: databaseUrl.host,
  directHost: directUrl.host,
};
