import "./config/envConfig.js"; // Must be first — validates env vars on startup

import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { envConfig } from "./config/envConfig.js";
import { logger } from "./config/logger.js";
import { sendSuccess } from "./lib/response.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

import { RATE_LIMIT_CONSTANTS } from "./CONSTANTS.js";
import STATUS_CODE from "./lib/HttpStatusCodes.js";
import fleetRoutes from "./modules/fleet/fleet.routes.js";
import iamRoutes from "./modules/iam/iam.routes.js";
import rentalsRoutes from "./modules/rentals/rentals.routes.js";

const app: Express = express();

// Security & Core Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request Logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }),
);

//  Rate Limiting
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_CONSTANTS.WINDOW_MS,
    max: RATE_LIMIT_CONSTANTS.MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests, please try again later.",
      code: STATUS_CODE.TOO_MANY_REQUESTS,
    },
  }),
);

//  Health Check
app.get("/api/v1/health", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
});

//  API Routes
app.use("/api/v1/iam", iamRoutes);
app.use("/api/v1/fleet", fleetRoutes);
app.use("/api/v1/rentals", rentalsRoutes);

// Swagger API Documentation
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.resolve(__dirname, "./swagger.json");

if (envConfig.NODE_ENV === "development" && fs.existsSync(swaggerPath)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  app.use("/api-docs", (req, res) => {
    res.send("Swagger file not found. Run 'npm run docs:generate' first.");
  });
}

//  Global Error Handler (must be last)
app.use(errorMiddleware);

//  Start
app.listen(envConfig.PORT, () => {
  logger.info(
    `Server running at http://localhost:${envConfig.PORT} [${envConfig.NODE_ENV}]`,
  );
});
