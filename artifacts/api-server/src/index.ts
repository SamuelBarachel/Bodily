import { logger } from "./lib/logger";

async function runBackgroundTasks(): Promise<void> {
  logger.info("API background process started");
}

runBackgroundTasks().catch((err) => {
  logger.error({ err }, "API background process failed");
  process.exit(1);
});
