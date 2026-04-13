import { PrismaClient } from "@prisma/client";
import { databaseConfig, env } from "../config/env.js";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  console.info(
    `[prisma] Initializing client. runtime=${databaseConfig.runtimeHost}${
      databaseConfig.directHost ? ` direct=${databaseConfig.directHost}` : ""
    } env=${env.NODE_ENV}`
  );

  return new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    },
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection() {
  const startedAt = Date.now();
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok" as const,
    latencyMs: Date.now() - startedAt,
    runtimeHost: databaseConfig.runtimeHost
  };
}
