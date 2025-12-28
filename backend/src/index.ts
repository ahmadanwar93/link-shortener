import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { closeDb, db } from "./db/index.js";

// index fle is the entry point (file that runs first)
// it is being used to configure Fastify app
// setup shutdown handler
// listen to HTTP requests
async function main() {
  // we are building the Fastify instance but not listening yet
  const app = await buildApp();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  // we want define callback functions that run when it receive the signals from OS
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info({ signal }, "Received shutdown signal");

      try {
        // stop fastify
        await app.close();
        logger.info("Fastify closed");
        // only close db pool when fastify is done
        await closeDb();
        logger.info("Database connections closed");
        // code 0 means success
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });
  }

  // start the server
  try {
    // this will resolve once port is bound. Server runs via event loop
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info({ port: env.PORT }, "Server started");
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}
main();
