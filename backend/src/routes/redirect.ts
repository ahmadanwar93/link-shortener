import { FastifyPluginAsync } from "fastify";
import { urlService } from "../services/url";
import { clickService } from "../services/click";
import { env } from "../config/env";

export const redirectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { code: string } }>(
    "/:code",
    async (request, reply) => {
      const { code } = request.params;

      const url = await urlService.getUrlByCode(code);

      if (!url) {
        return reply.redirect(`${env.FRONTEND_URL}/not-found`, 302);
      }

      // fire and forget (not awaiting)
      // but since it is a promise we can do catch chaining to log so that it is not failing silently
      clickService
        .recordClick({
          urlId: url.id,
          userAgent: request.headers["user-agent"] ?? null,
          referer: request.headers["referer"] ?? null,
        })
        .catch((error) => {
          request.log.error(
            { err: error, urlId: url.id },
            "Failed to record click"
          );
        });

      // 3. Redirect (302 = temporary, not cached by browser)
      return reply.redirect(url.originalUrl, 302);
    }
  );
};
