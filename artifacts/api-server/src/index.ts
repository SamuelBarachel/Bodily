import http from "node:http";

import { logger } from "./lib/logger";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: ${process.env.PORT ?? "undefined"}`);
}

async function runBackgroundTasks(): Promise<void> {
  logger.info({ port }, "API background process started");
}

function startHttpServer(): http.Server {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "API server listening");
  });

  return server;
}

async function main(): Promise<void> {
  await runBackgroundTasks();
  startHttpServer();
}

main().catch((err) => {
  logger.error({ err }, "API background process failed");
  process.exit(1);
});
