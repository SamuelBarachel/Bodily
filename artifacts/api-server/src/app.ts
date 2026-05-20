import path from "node:path";
import fs from "node:fs";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes always take priority over static serving
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  // __dirname is injected by the esbuild banner — resolves to artifacts/api-server/dist/
  // Go up three levels to workspace root, then into the Expo web export output dir.
  const webDist = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "artifacts",
    "mobile",
    "dist",
  );
  const indexHtml = path.join(webDist, "index.html");

  if (fs.existsSync(webDist)) {
    logger.info({ webDist }, "Serving Expo web build");

    // Hashed asset files get long-lived caching; index.html is excluded so the
    // SPA catch-all below always serves a fresh shell.
    app.use(express.static(webDist, { maxAge: "1y", immutable: true, index: false }));

    // SPA fallback — Expo Router handles all client-side navigation
    app.use((_req: Request, res: Response) => {
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res
          .status(503)
          .send("<h1>Bodily</h1><p>Web build incomplete — index.html missing.</p>");
      }
    });
  } else {
    logger.warn({ webDist }, "Expo web dist not found — run build:web first");
    app.use((_req: Request, res: Response) => {
      res
        .status(503)
        .send(
          "<h1>Bodily</h1><p>Frontend not built yet. Run <code>pnpm --filter @workspace/mobile run build:web</code>.</p>",
        );
    });
  }
} else {
  // Development: simple alive check at root
  app.get("/", (_req: Request, res: Response) => {
    res.json({ service: "bodily-api", status: "ok", env: "development" });
  });
}

export default app;
