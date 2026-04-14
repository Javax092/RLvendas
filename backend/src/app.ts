import express, { type RequestHandler } from "express";
import * as helmetModule from "helmet";
import morgan from "morgan";
import { databaseConfig, env } from "./config/env.js";
import { checkDatabaseConnection } from "./lib/prisma.js";
import { corsMiddleware, corsPreflight } from "./middlewares/cors.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRoutes } from "./routes/index.js";
import { asyncHandler } from "./utils/async-handler.js";

export const app = express();

const helmet = ((
  helmetModule as unknown as {
    default?: RequestHandler | (() => RequestHandler);
  }
).default ??
  (helmetModule as unknown as () => RequestHandler)) as () => RequestHandler;

app.set("trust proxy", 1);
app.use(helmet());
app.use(corsMiddleware);
app.options("*", corsPreflight);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((request, _response, next) => {
  console.info(`[req] ${request.method} ${request.path} origin=${request.headers.origin ?? "n/a"}`);
  next();
});

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "RL Burger SaaS API",
    environment: env.NODE_ENV,
    databaseHost: databaseConfig.runtimeHost,
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_request, response) => {
  response.status(200).json({
    ok: true,
    service: "RL Burger SaaS API",
    status: "online",
    healthcheck: "/health",
  });
});

app.get(
  "/health/db",
  asyncHandler(async (_request, response) => {
    try {
      const database = await checkDatabaseConnection();

      return response.status(200).json({
        status: "ok",
        database,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao consultar o banco de dados.";

      return response.status(503).json({
        status: "error",
        database: {
          status: "error",
          runtimeHost: databaseConfig.runtimeHost,
          message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
