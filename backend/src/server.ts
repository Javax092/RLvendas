import { app } from "./app.js";
import { allowedAppOrigins, databaseConfig, env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { registeredApiRoutes } from "./routes/index.js";
import { ensureDemoRestaurantData } from "./services/bootstrap-demo.js";

const host = env.NODE_ENV === "test" ? "127.0.0.1" : "0.0.0.0";

async function main() {
  try {
    await ensureDemoRestaurantData();
  } catch (error) {
    console.error("[bootstrap] Failed to ensure demo restaurant data.", error);
  }

  const server = app.listen(env.PORT, host, () => {
    console.log(`[boot] API running on http://${host}:${env.PORT}`);
    console.log(`[boot] Environment: ${env.NODE_ENV}`);
    console.log(`[boot] Frontend URL: ${env.FRONTEND_URL ?? "not configured"}`);
    console.log(`[boot] Allowed CORS origins: ${allowedAppOrigins.join(", ")}`);
    console.log(`[boot] Prisma runtime host: ${databaseConfig.runtimeHost}`);
    console.log(`[boot] Prisma direct host: ${databaseConfig.directHost}`);
    console.log("[boot] Healthcheck: GET /health");
    console.log("Registered API routes:");

    for (const route of registeredApiRoutes) {
      console.log(`- ${route}`);
    }
  });

  async function shutdown(signal: string) {
    console.log(`[shutdown] Received ${signal}. Closing server.`);

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
