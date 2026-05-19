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

const webDist = path.resolve(__dirname, "../../mobile/dist");

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));

  app.get("*", (_req: Request, res: Response) => {
    const indexPath = path.join(webDist, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });
}

export default app;
