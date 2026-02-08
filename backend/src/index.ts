import express, { Request, Response } from "express";
import fs from "fs";
import { papersRouter } from "./routes/papers";
import { errorHandler } from "./middleware/error-handler";
import { config } from "./config";
import pdfRoutes from "./routes/pdf";
import implementRoutes from "./routes/implement";
import { explainRouter } from "./routes/explain";

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS (configurable via ALLOWED_ORIGINS or FRONTEND_URL)
const originsList = config.allowedOrigins === '*'
  ? ['*']
  : config.allowedOrigins.split(',').map((o) => o.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (originsList.includes('*') || (origin && originsList.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Better Papers API is running" });
});

// Routes
app.use("/api", pdfRoutes);
app.use("/api", implementRoutes);
app.use("/api/papers", papersRouter);
app.use("/api/explain", explainRouter);

app.use(errorHandler);

// Ensure upload directory exists (uses config.uploadDir; safe for Railway/ephemeral disk)
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Start server (listen on 0.0.0.0 for Railway/container environments)
const host = process.env.HOST || "0.0.0.0";
app.listen(config.port, host, () => {
  console.log(`Server running on http://${host}:${config.port}`);
  console.log(`Health check: http://${host}:${config.port}/health`);
});
