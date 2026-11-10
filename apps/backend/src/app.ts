import express from "express";
import { adminRouter } from "@/routes/admin.routes";
import { caretaterRouter } from "@/routes/caretakers.routes";
import { daycareRouter } from "./routes/daycares.routes";
import inquiriesRouter from "./routes/inquiries.routes";
import { setupSwagger } from "./config/swagger";
import cors from "cors";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  "/uploads",
  express.static("src/uploads")
);

// Swagger API Documentation (UI available at /api-docs and JSON at /api-docs.json)
setupSwagger(app);

//Health Check
app.get("/", (req, res) => {
  res.json({
    sccess: true,
    message: "toddler daycare api is running",
    documentation: "/api-docs"
  })
})

//admin routes
app.use(
  ["/api/admin", "/api/v1/admin", "/api/auth", "/api/v1/auth", "/api/v1", "/api"],
  adminRouter
);

//caretaker auth routes (support both /api and /api/v1)
app.use(["/api/caretaker/auth", "/api/v1/caretaker/auth"], caretaterRouter);

//daycare routes (support both /api and /api/v1)
app.use(["/api/caretaker/daycare", "/api/v1/caretaker/daycare"], daycareRouter);

//inquiries and email routes (support both /api and /api/v1)
app.use(
  ["/api/inquiries", "/api/v1/inquiries", "/api", "/api/v1"],
  inquiriesRouter
);

// Centralized JSON Error Handler (prevents Express from printing HTML <pre> pages)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.statusCode || err.status || 400;
  res.status(status).json({
    success: false,
    message: err.message || "An unexpected error occurred",
  });
});

export default app;