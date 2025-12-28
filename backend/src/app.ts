import Fastify, { FastifyError } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { authRoutes } from "./routes/auth.js";
import { urlRoutes } from "./routes/urls.js";

export async function buildApp() {
  // in this case, we are building the root container level, we are not splitting into plugin yet
  const app = Fastify({
    loggerInstance: logger,
    // generates unique request IDs for distributed tracing
    // each request gets a unique ID accessible via request.id
    genReqId: () => crypto.randomUUID(),
    // disables Fastify's automatic request/response logging
    // implement custom logging in the onResponse hook for more control
    disableRequestLogging: true,
  });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await app.register(cookie, {
    // Cookie signing secret (optional but recommended)
    // secret: env.COOKIE_SECRET,
  });

  await app.register(authRoutes);
  await app.register(urlRoutes);

  app.addHook("onResponse", (request, reply, done) => {
    // conceptually quite similar to axios interceptor, but happens on server side
    // this fires after response is sent to client
    // we cant modify the response
    // use for logging, metrics and cleanup

    // Fastify automatically injects reqId into every log call made via request.log
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      "Request completed"
    );
    // done() to signal hook completion, but if we use async await callback, we dont have to do done()
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusCode = (error as FastifyError).statusCode ?? 500;
    const code = (error as FastifyError).code ?? "INTERNAL_ERROR";

    request.log.error({ err }, "Request error");

    const message =
      statusCode >= 500 && env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message;

    reply.status(statusCode).send({
      error: message,
      code,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // Health check
  app.get("/health", async (request) => {
    // These all include reqId automatically:
    // request.log.info("Test 1"); // Has reqId
    // request.log.info({ foo: "bar" }, "Test 2"); // Has reqId + foo

    // But the root logger doesn't:
    // logger.info("Test 3"); // No reqId (not request-scoped)
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      // Optional: add DB check here later
    };
  });

  return app;
}

// fastify has different encapsulation compares to laravel. Laravel app is a global singleton, hence a unified container. Everything shares the same container
// fastify plugin create child contexts
