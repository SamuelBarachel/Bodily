import app from "./app";
import { logger } from "./lib/logger";

const port = process.env.PORT || 8080;

const server = app.listen(Number(port), "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
