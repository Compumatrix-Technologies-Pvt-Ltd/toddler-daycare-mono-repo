import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import daycaresRoutes from "./daycares.routes.js";
import inquiriesRoutes from "./inquiries.routes.js";
import caretakersRoutes from "./caretakers.routes.js";
import adminRoutes from "./admin.routes.js";

const apiRouter = Router();

// Mount health check directly under /api/health
apiRouter.use(healthRoutes);

// Mount versioned REST API v1 routes
const v1Router = Router();
v1Router.use(authRoutes);
v1Router.use(daycaresRoutes);
v1Router.use(inquiriesRoutes);
v1Router.use(caretakersRoutes);
v1Router.use(adminRoutes);

apiRouter.use("/v1", v1Router);

export default apiRouter;

