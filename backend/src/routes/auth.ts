import { FastifyPluginAsync } from "fastify";
import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authHandler = toNodeHandler(auth);

  fastify.addContentTypeParser(
    "application/json",
    (_request, _payload, done) => {
      done(null, undefined);
    }
  );

  fastify.all("/api/auth/*", async (request, reply) => {
    console.log("Auth route hit:", request.method, request.url);
    reply.hijack();

    try {
      await authHandler(request.raw, reply.raw);
    } catch (error) {
      console.error("Auth handler error:", error);
      reply.raw.statusCode = 500;
      reply.raw.setHeader("Content-Type", "application/json");
      reply.raw.end(
        JSON.stringify({ error: "Auth error", details: String(error) })
      );
    }
  });
};
