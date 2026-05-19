import app from "./app";
import { logger } from "./lib/logger";

const port = parseInt(process.env.PORT ?? "8080", 10);

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "API server listening");
});
