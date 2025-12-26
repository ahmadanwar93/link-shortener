import { FastifyPluginAsync } from "fastify";
import { auth } from "../lib/auth.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // betterAuth expects Fetch API request since it is framework agnostic
  // that is why we have to convert the FastifyRequest into Fetch API request
  fastify.route({
    // full route declaration API, this is a wildcard matcher
    method: ["GET", "POST"],
    url: "/api/auth/*",
    // handler function is like laravel controller
    async handler(request, reply) {
      try {
        // construct full url
        const url = new URL(request.url, `http://${request.headers.host}`);
        // convert Fastify header into fetch API header class
        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, String(value));
        });

        // Construct Fetch API Request from Fastify's request
        // we have tp reserialise the body becase Fastify already parsed it into an object
        const fetchRequest = new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : null,
        });

        // Use Better Auth's Fetch API handler
        const response = await auth.handler(fetchRequest);

        // Convert Fetch API Response to Fastify reply
        // we extract from the fetch API response, and forward to Fastify reply
        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));

        const body = await response.text();
        return reply.send(body || null);
      } catch (error) {
        request.log.error({ err: error }, "Auth handler error");
        return reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        });
      }
    },
  });
};
