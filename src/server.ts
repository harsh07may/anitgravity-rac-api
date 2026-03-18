import "./config/envConfig.js"; // Must be first — validates env vars on startup
import express, { type Express, type Request, type Response } from "express";
import expressOasGenerator from "express-oas-generator";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";

import { envConfig } from "./config/envConfig.js";
import { logger } from "./config/logger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { sendSuccess } from "./lib/response.js";

import iamRoutes from "./modules/iam/iam.routes.js";
import fleetRoutes from "./modules/fleet/fleet.routes.js";
import rentalsRoutes from "./modules/rentals/rentals.routes.js";
import { RATE_LIMIT_CONSTANTS } from "./CONSTANTS.js";
import STATUS_CODE from "./lib/HttpStatusCodes.js";

const app: Express = express();

// oas-generator is runtime; TS is not so ig its okay lol
expressOasGenerator.handleResponses(app as any, {} as any);

// Security & Core Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logging
app.use(pinoHttp({ logger }));

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

//  Global Error Handler (must be last)
app.use(errorMiddleware);
expressOasGenerator.handleRequests();

//  Start
app.listen(envConfig.PORT, () => {
  logger.info(
    `Server running at http://localhost:${envConfig.PORT} [${envConfig.NODE_ENV}]`,
  );
});
