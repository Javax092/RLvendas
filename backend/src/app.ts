import cors from "cors";
import type { CorsOptions } from "cors";
import express, { type RequestHandler } from "express";
import * as helmetModule from "helmet";
import morgan from "morgan";
import { allowedAppOrigins, databaseConfig, env } from "./config/env.js";
import { checkDatabaseConnection } from "./lib/prisma.js";
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
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedAppOrigins.includes(origin.replace(/\/+$/, ""))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use((request, _response, next) => {
  console.info(`[REQ] ${request.method} ${request.path}`);
  next();
});

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    environment: env.NODE_ENV,
    databaseHost: databaseConfig.runtimeHost,
    timestamp: new Date().toISOString(),
  });
});
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "RL Burger SaaS API",
  });
});

app.get(
  "/health/db",
  asyncHandler(async (_request, response) => {
    try {
      const database = await checkDatabaseConnection();

      return response.json({
        status: "ok",
        database,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao consultar o banco de dados.";

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
