import express, { Request, Response } from "express";
import cors from "cors";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome status endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Toddler Daycare REST Backend",
    version: "1.0.0",
    engine: "Node.js Express",
    status: "online",
    endpoints: {
      health: "/api/health",
      daycares: "/api/v1/daycares",
      inquiries: "/api/v1/inquiries",
      caretakers: "/api/v1/caretakers/profile",
      admin: "/api/v1/admin/dashboard",
    },
  });
});

// Mount /api routes
app.use("/api", apiRouter);

// 404 catch-all
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: "Endpoint not found",
    errors: { route: ["The requested REST API route does not exist."] },
  });
});

// Global error handler
app.use(errorHandler);

export default app;

