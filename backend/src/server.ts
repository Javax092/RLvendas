import { app } from "./app.js";
import { databaseConfig, env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { registeredApiRoutes } from "./routes/index.js";

const host = env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

const server = app.listen(env.PORT, host, () => {
  console.log(`[boot] API running on ${host}:${env.PORT}`);
  console.log(`[boot] Environment: ${env.NODE_ENV}`);
  console.log(`[boot] Frontend origin: ${env.FRONTEND_URL}`);
  console.log(`[boot] Prisma runtime host: ${databaseConfig.runtimeHost}`);
  if (databaseConfig.directHost) {
    console.log(`[boot] Prisma direct host: ${databaseConfig.directHost}`);
  }
  console.log("Registered API routes:");
  for (const route of registeredApiRoutes) {
    console.log(`- ${route}`);
  }
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
