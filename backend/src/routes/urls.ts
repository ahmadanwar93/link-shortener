import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";
// here we are still importing files in, instead of using decorator
import { urlService, UrlServiceError } from "../services/url.js";

const createUrlSchema = z.object({
  url: z
    .url("Invalid URL format")
    .max(2048, "URL too long")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://"),
      "URL must start with http:// or https://"
    ),
  customAlias: z
    .string()
    .min(3, "Alias must be at least 3 characters")
    .max(30, "Alias must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Alias can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),
});
// extract typescript type from zod schema definition
type CreateUrlBody = z.infer<typeof createUrlSchema>;

export const urlRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  // when .get(), .post() etc is used, basically we are registering a route
  // TODO: can refer @fastify/type-provider-zod next time
  fastify.post<{ Body: CreateUrlBody }>("/api/urls", async (request, reply) => {
    // safeParse validates data against Zod schema and returns a results object instead of throwing error
    // that is why we are not wrapping the safeParse in a try catch block
    // we check the success key instead
    const parseResult = createUrlSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parseResult.error.flatten((issue) => issue.message)
          .fieldErrors,
      });
    }

    const { url: originalUrl, customAlias } = parseResult.data;

    try {
      const url = await urlService.createUrl({
        originalUrl,
        userId: request.user!.id,
        customAlias,
      });

      const shortUrl = `${env.BETTER_AUTH_URL}/${url.shortCode}`;

      // DTO (data transfer object), database entity and api response can differ hence can do custom mapping.
      // similar to laravel json resource
      // alternative way is to create a new object to do the mapping to reduce duplication
      return reply.status(201).send({
        id: url.id,
        shortCode: url.shortCode,
        shortUrl,
        originalUrl: url.originalUrl,
        clickCount: url.clickCount,
        isCustomAlias: url.isCustomAlias,
        createdAt: url.createdAt,
      });
    } catch (error) {
      if (error instanceof UrlServiceError) {
        // the probelm with this method is that the mapping will be scattered across multiple routes
        // alternative way is to do a centralised error handler
        const statusMap: Record<string, number> = {
          ALIAS_RESERVED: 409,
          ALIAS_TAKEN: 409,
          ALIAS_INVALID: 400,
          FORBIDDEN: 403,
          GENERATION_FAILED: 500,
        };
        const statusCode = statusMap[error.code] ?? 500;

        return reply.status(statusCode).send({
          error: error.message,
          code: error.code,
        });
      }
      // will be caught by global error catcher
      throw error;
    }
  });

  fastify.get("/api/urls", async (request, reply) => {
    const userUrls = await urlService.getUrlsByUser(request.user!.id);

    const response = userUrls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${env.BETTER_AUTH_URL}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      clickCount: url.clickCount,
      isCustomAlias: url.isCustomAlias,
      createdAt: url.createdAt,
    }));

    return reply.send(response);
  });

  fastify.delete<{ Params: { code: string } }>(
    "/api/urls/:code",
    async (request, reply) => {
      const { code } = request.params;

      try {
        const deleted = await urlService.deleteUrl(code, request.user!.id);

        // if deleteUrl returns false in case the url is not found
        if (!deleted) {
          return reply.status(404).send({
            error: "URL not found",
            code: "NOT_FOUND",
          });
        }

        // 204 No Content - success with no response body
        return reply.status(204).send();
      } catch (error) {
        // if deleteUrl throws FORBIDDEN error
        if (error instanceof UrlServiceError) {
          if (error.code === "FORBIDDEN") {
            return reply.status(403).send({
              error: error.message,
              code: error.code,
            });
          }
        }
        // anything else just rethrow to global
        throw error;
      }
    }
  );
};
