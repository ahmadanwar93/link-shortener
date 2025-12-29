import { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { analyticsService } from "../services/analytics.js";

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", requireAuth);

  fastify.get<{ Params: { code: string } }>(
    "/api/analytics/:code",
    async (request, reply) => {
      const { code } = request.params;

      const analytics = await analyticsService.getUrlAnalytics(
        code,
        request.user!.id
      );

      if (!analytics) {
        // if not found or unauthorized, we would return null from the service hence catch it here
        return reply.status(404).send({
          error: "URL not found or access denied",
          code: "NOT_FOUND",
        });
      }

      return reply.send(analytics);
    }
  );
};
