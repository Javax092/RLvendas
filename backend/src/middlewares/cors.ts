import cors from "cors";
import type { CorsOptions } from "cors";
import { allowedAppOrigins, isAllowedOrigin } from "../config/env.js";

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(
      `[cors] Blocked origin "${origin ?? "unknown"}". Allowed origins: ${allowedAppOrigins.join(", ")}`,
    );

    return callback(new Error(`Not allowed by CORS: ${origin ?? "unknown"}`));
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

export const corsMiddleware = cors(corsOptions);
export const corsPreflight = cors(corsOptions);
