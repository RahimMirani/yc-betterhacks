import express, { Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/auth";
import { papersRouter } from "./routes/papers";
import { errorHandler } from "./middleware/error-handler";
import { config } from "./config";
import pdfRoutes from "./routes/pdf";
import implementRoutes from "./routes/implement";
import { explainRouter } from "./routes/explain";

const app = express();

// CORS — must come first, with credentials support for auth cookies
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Better Auth handler — MUST be before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Better Papers API is running" });
});

// Protected routes — require authentication
app.use("/api/papers", requireAuth, papersRouter);
app.use("/api/explain", requireAuth, explainRouter);
app.use("/api", requireAuth, pdfRoutes);
app.use("/api", requireAuth, implementRoutes);

app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});
