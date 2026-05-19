import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const staticRoot = path.resolve(__dirname, "../../mobile/static-build");
const templatePath = path.resolve(
  __dirname,
  "../../mobile/server/templates/landing-page.html",
);

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(__dirname, "../../mobile/app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return (appJson.expo?.name as string) || "Bodily";
  } catch {
    return "Bodily";
  }
}

const appName = getAppName();

if (fs.existsSync(staticRoot)) {
  app.get(["/", "/manifest"], (req: Request, res: Response) => {
    const platform = req.headers["expo-platform"] as string | undefined;

    if (platform === "ios" || platform === "android") {
      const manifestPath = path.join(staticRoot, platform, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        res.setHeader("content-type", "application/json");
        res.setHeader("expo-protocol-version", "1");
        res.setHeader("expo-sfv-version", "0");
        res.send(fs.readFileSync(manifestPath, "utf-8"));
        return;
      }
      res.status(404).json({ error: `No manifest for platform: ${platform}` });
      return;
    }

    if (req.path === "/manifest") {
      res.status(404).json({ error: "expo-platform header required" });
      return;
    }

    if (fs.existsSync(templatePath)) {
      const proto = req.headers["x-forwarded-proto"] ?? "https";
      const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "";
      const baseUrl = `${proto}://${host}`;

      const html = fs
        .readFileSync(templatePath, "utf-8")
        .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
        .replace(/EXPS_URL_PLACEHOLDER/g, String(host))
        .replace(/APP_NAME_PLACEHOLDER/g, appName);

      res.setHeader("content-type", "text/html; charset=utf-8");
      res.send(html);
    } else {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.send(`<h1>${appName}</h1><p>App not yet built.</p>`);
    }
  });

  app.use(express.static(staticRoot));
}

export default app;
