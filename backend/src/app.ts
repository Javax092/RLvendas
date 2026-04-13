import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.APP_URL }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use((request, _response, next) => {
  console.info(`[REQ] ${request.method} ${request.path}`);
  next();
});

app.get("/health", (_request, response) => {
  response.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
